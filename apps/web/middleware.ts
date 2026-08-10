import { NextResponse, type NextRequest } from "next/server";
import { SELECTED_ROLE_COOKIE, isSelectedRole, resolveActiveMode, type SelectedRole } from "@/lib/role";

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

/** ADMIN -> /admin; else by capability/active-mode (ADR-046b) — a dual-capability account lands
 * wherever its current mode points, not a fixed role-derived home. */
function dashboardHomeFor(role: string | undefined, activeMode: SelectedRole) {
  if (role === "ADMIN") return "/admin";
  return activeMode === "PARTNER" ? "/partner" : "/dashboard";
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
  // ADR-049 — Service Provider CAPABILITY, decoupled from both `role` (ADR-046b) and from
  // verification/`APPROVED` status. Server-verified (read straight off the session, never
  // trusted from a client-supplied cookie) — this is what every hard gate below (`/partner`)
  // actually checks; the `selectedRole` cookie below is UX routing only (which of the two
  // dashboards a *capable* account currently wants to see). A profile exists (`partnerStatus`
  // set at all) and hasn't been admin-`SUSPENDED` — verification status doesn't matter here,
  // deliberately: membership is additionally enforced server-side per `/api/partner/**` call
  // (`evaluatePartnerCapability`) and by the explicit "Switch Mode" action, not on every
  // navigation, matching how Rider membership already isn't checked on every `/dashboard` render.
  const partnerStatus = session.user.partnerStatus as string | null | undefined;
  const isCapableServiceProvider = partnerStatus != null && partnerStatus !== "SUSPENDED";

  const cookieMode = request.cookies.get(SELECTED_ROLE_COOKIE)?.value;
  const activeMode: SelectedRole = isSelectedRole(cookieMode) ? cookieMode : resolveActiveMode(partnerStatus);

  const isPartnerRoute = isPathOrSubpath(pathname, "/partner");
  const isAdminRoute = isPathOrSubpath(pathname, "/admin");
  const isDashboardRoute = isPathOrSubpath(pathname, "/dashboard");

  if (isPartnerRoute && !isCapableServiceProvider) {
    return NextResponse.redirect(new URL(dashboardHomeFor(role, activeMode), url));
  }
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(dashboardHomeFor(role, activeMode), url));
  }
  // A Service Provider currently in Service Provider mode must never land on the Rider
  // dashboard — that's where SOS *creation* (Red/Amber panic cards) lives. Only a UX
  // routing concern (not the capability gate above, hence also keyed on `activeMode`) — a
  // dual-capability account in Rider mode is completely unaffected. ADMIN is intentionally
  // exempt (see dashboardHomeFor above — admins get the rider experience outside of /admin by
  // design).
  if (isDashboardRoute && role !== "ADMIN" && isCapableServiceProvider && activeMode === "PARTNER") {
    return NextResponse.redirect(new URL(dashboardHomeFor(role, activeMode), url));
  }
  // Entering either section while capable implicitly switches the active mode to match —
  // navigating IS how a capable account switches, same as the explicit "Switch Mode" control.
  // A full redirect (not just setting the cookie on a pass-through response) so the new cookie
  // value is guaranteed visible to the page's own server-side `cookies()` read in this same
  // navigation, not just the next one.
  const impliedMode: SelectedRole | null = isPartnerRoute && isCapableServiceProvider ? "PARTNER" : isDashboardRoute ? "RIDER" : null;

  if (!isSelectedRole(cookieMode) || (impliedMode && impliedMode !== cookieMode)) {
    const response = NextResponse.redirect(url);
    response.cookies.set(SELECTED_ROLE_COOKIE, impliedMode ?? activeMode, {
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
