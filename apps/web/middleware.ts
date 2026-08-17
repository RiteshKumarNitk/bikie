import { NextResponse, type NextRequest } from "next/server";
import { SELECTED_ROLE_COOKIE, isSelectedRole } from "@/lib/role";

// Deliberately NOT imported from @bikie/services here (unlike other gates) — that package's
// barrel export pulls in Node-only modules (message-crypto's `crypto`, razorpay) incompatible
// with the Edge Middleware runtime. This one-line check is inlined instead, same reasoning as
// the local `getSession` helper below avoiding the better-auth server import.
function isServiceProviderAccountType(user: { accountType?: string | null } | null | undefined): boolean {
  return user?.accountType === "SERVICE_PROVIDER";
}

// Helper to fetch session without importing better-auth server (prevents 1MB Edge Function bloat)
async function getSession(request: NextRequest) {
  try {
    const response = await fetch(new URL("/api/auth/get-session", request.url).toString(), {
      headers: request.headers,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.session ? data : null;
  } catch (err) {
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

export default async function middleware(request: NextRequest) {
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
