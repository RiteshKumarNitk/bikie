import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@bikie/auth";
import { SELECTED_ROLE_COOKIE, isSelectedRole } from "@/lib/role";

// Deliberately NOT imported from @bikie/services here (unlike other gates) — the barrel export
// pulls in Node-only modules (message-crypto's `crypto`, razorpay) and the one-line check below
// needs nothing from it. Same discipline as the `auth` import here being the only heavy module
// this file pulls in.
function isServiceProviderAccountType(user: { accountType?: string | null } | null | undefined): boolean {
  return user?.accountType === "SERVICE_PROVIDER";
}

// Resolve the session in-process, exactly like every API gate does (lib/get-session.ts). The
// previous implementation fetched the app's own /api/auth/get-session over the public origin —
// behind the production Docker/Nginx topology that self-fetch never completed reliably (hairpin
// routing + Secure-cookie dropping over plaintext http), and the catch-all silently turned every
// transport failure into "no session", redirecting valid users to /login.
//
// This file uses the Next.js 16 `proxy` convention (formerly `middleware.ts`), which runs on the
// Node.js runtime — the same runtime as the server components and route handlers that already
// load `@bikie/auth` + Prisma. (The legacy `middleware.ts` name still bundled for the Edge
// runtime, where these Node-only modules fail to load at module evaluation.)
async function getSession(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.session ? session : null;
  } catch (err) {
    console.error("[proxy][getSession]", err);
    return null;
  }
}

/** ADMIN -> /admin; else by `accountType` (ADR-053) — server-authoritative, mutually exclusive,
 * never a client-routing cookie. */
function dashboardHomeFor(role: string | undefined, accountType: string | undefined) {
  if (role === "ADMIN") return "/admin";
  return accountType === "SERVICE_PROVIDER" ? "/partner" : "/dashboard";
}

/** `pathname.startsWith("/partner")` also matches "/partners" — the public
 * marketing site added alongside this gate. Boundary-safe check instead. */
function isPathOrSubpath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;

  const session = await getSession(request);

  if (!session) {
    const selectedRole = request.cookies.get(SELECTED_ROLE_COOKIE)?.value;

    if (!isSelectedRole(selectedRole)) {
      const welcomeUrl = new URL("/welcome", url);
      welcomeUrl.searchParams.set("next", pathname + url.search);
      return NextResponse.redirect(welcomeUrl);
    }

    const loginUrl = new URL("/login", url);
    loginUrl.searchParams.set("next", pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role as string | undefined;
  const accountType = session.user.accountType as string | undefined;
  // ADR-053 — `accountType` is server-authoritative and mutually exclusive: an account is Rider
  // XOR Service Provider, never both, never client-routed. Replaces the old dual-capability
  // `partnerStatus`-derived formula + `selectedRole` mode cookie (ADR-046b–051) — there's no
  // "active mode" to resolve or imply anymore, this is the one check every gate below uses.
  const isCapableServiceProvider = isServiceProviderAccountType(session.user);

  const isPartnerRoute = isPathOrSubpath(pathname, "/partner");
  const isAdminRoute = isPathOrSubpath(pathname, "/admin");
  const isDashboardRoute = isPathOrSubpath(pathname, "/dashboard");

  if (isPartnerRoute && !isCapableServiceProvider) {
    return NextResponse.redirect(new URL(dashboardHomeFor(role, accountType), url));
  }
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(dashboardHomeFor(role, accountType), url));
  }
  // A Service Provider account must never land on the Rider dashboard — that's where SOS
  // *creation* (Red/Amber panic cards) lives. ADMIN is intentionally exempt (see
  // dashboardHomeFor above — admins get the rider experience outside of /admin by design).
  if (isDashboardRoute && role !== "ADMIN" && isCapableServiceProvider) {
    return NextResponse.redirect(new URL(dashboardHomeFor(role, accountType), url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|welcome|login|signup).*)"],
};
