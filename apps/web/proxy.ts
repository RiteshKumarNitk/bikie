import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@bikie/auth";
import { SELECTED_ROLE_COOKIE, dbRoleToSelectedRole, isSelectedRole } from "@/lib/role";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function dashboardHomeForRole(role: string | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PARTNER") return "/partner";
  return "/dashboard";
}

/** `pathname.startsWith("/partner")` also matches "/partners" — the public
 * marketing site added alongside this gate. Boundary-safe check instead. */
function isPathOrSubpath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname } = url;

  const isPartnerRoute = isPathOrSubpath(pathname, "/partner");
  const isAdminRoute = isPathOrSubpath(pathname, "/admin");
  const isDashboardRoute = isPathOrSubpath(pathname, "/dashboard");

  if (isPartnerRoute || isAdminRoute || isDashboardRoute) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      const loginUrl = new URL("/login", url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = session.user.role as string | undefined;

    if (isPartnerRoute && role !== "PARTNER") {
      return NextResponse.redirect(new URL(dashboardHomeForRole(role), url));
    }
    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL(dashboardHomeForRole(role), url));
    }

    return NextResponse.next();
  }

  // Public/marketing routes: gate on the pre-auth `selectedRole` cookie so
  // first-time visitors land on /welcome instead of the homepage. See
  // .docs/DECISIONS.md ADR-012.
  const selectedRole = request.cookies.get(SELECTED_ROLE_COOKIE)?.value;
  if (isSelectedRole(selectedRole)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    // Already-authenticated user with no selectedRole cookie (e.g. an
    // account predating this feature, or cleared cookies) — silently
    // backfill from their DB role rather than detouring through /welcome.
    // A Set-Cookie on a pass-through response isn't visible to this same
    // request's later `cookies()` reads, so we redirect to re-run with it.
    const derived = dbRoleToSelectedRole(session.user.role as string | undefined);
    const response = NextResponse.redirect(url);
    response.cookies.set(SELECTED_ROLE_COOKIE, derived, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
    return response;
  }

  const welcomeUrl = new URL("/welcome", url);
  welcomeUrl.searchParams.set("next", pathname + url.search);
  return NextResponse.redirect(welcomeUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|welcome|login|signup).*)"],
};
