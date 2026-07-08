import { NextResponse } from "next/server";
import { auth } from "@bikie/auth";

function dashboardHomeForRole(role: string | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "PARTNER") return "/partner";
  return "/dashboard";
}

export async function proxy(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  const isPartnerRoute = pathname.startsWith("/partner");
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (!isPartnerRoute && !isAdminRoute && !isDashboardRoute) {
    return NextResponse.next();
  }

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

export const config = {
  matcher: ["/dashboard/:path*", "/partner/:path*", "/admin/:path*"],
};
