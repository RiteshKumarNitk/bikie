import { NextResponse, type NextRequest } from "next/server";
import { SELECTED_ROLE_COOKIE, dbRoleToSelectedRole, isSelectedRole } from "@/lib/role";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Helper to fetch session without importing better-auth server (prevents 1MB Edge Function bloat)
async function getSession(request: NextRequest) {
  try {
    const response = await fetch(new URL("/api/auth/get-session", request.url).toString(), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.session ? data : null;
  } catch (err) {
    return null;
  }
}

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

  const isPartnerRoute = isPathOrSubpath(pathname, "/partner");
  const isAdminRoute = isPathOrSubpath(pathname, "/admin");
  const isDashboardRoute = isPathOrSubpath(pathname, "/dashboard");

  if (isPartnerRoute && role !== "PARTNER") {
    return NextResponse.redirect(new URL(dashboardHomeForRole(role), url));
  }
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(dashboardHomeForRole(role), url));
  }
  // A Service Provider must never land on the Rider dashboard — that's where SOS
  // *creation* (Red/Amber panic cards) lives, a Rider-only capability. ADMIN is
  // intentionally exempt (see dashboardHomeForRole above — admins get the rider
  // experience outside of /admin by design).
  if (isDashboardRoute && role === "PARTNER") {
    return NextResponse.redirect(new URL(dashboardHomeForRole(role), url));
  }

  const selectedRole = request.cookies.get(SELECTED_ROLE_COOKIE)?.value;
  if (!isSelectedRole(selectedRole)) {
    const derived = dbRoleToSelectedRole(role);
    const response = NextResponse.redirect(url);
    response.cookies.set(SELECTED_ROLE_COOKIE, derived, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|welcome|login|signup).*)"],
};
