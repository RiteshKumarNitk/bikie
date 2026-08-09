"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SELECTED_ROLE_COOKIE, isSafeNext, type SelectedRole } from "@/lib/role";
import { getServerSession } from "@/lib/get-session";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Sets the pre-auth site-experience cookie and redirects. Used by the
 * /welcome gate and the nav's "Switch to Rider/Partner" affordance. Not
 * httpOnly — the signup page (a client component) reads it to seed which
 * role's fields to render, and it carries no sensitive data (just a UI
 * preference, "RIDER" or "PARTNER").
 *
 * Per ADR-014, picking a role on /welcome no longer drops the visitor straight onto the
 * homepage/marketing page — both roles now go to /login by default (which already offers a
 * "no account yet? sign up" fallback), so a role is chosen and then the visitor authenticates
 * before seeing any dashboard content. An explicit `next` (e.g. the "Become a Service
 * Provider" upgrade flow, which already passes `next=/login`) is still honored as-is. */
export async function selectRole(role: SelectedRole, next?: string) {
  const store = await cookies();
  store.set(SELECTED_ROLE_COOKIE, role, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  const target = isSafeNext(next) && next !== "/" ? next : "/login";
  redirect(target);
}

/** ADR-046b — the post-auth "Switch Mode" control. Server-verifies capability before allowing
 * PARTNER (never trusts the client to only call this when it's actually approved) and redirects
 * straight to the target dashboard, same round-trip-a-redirect approach `middleware.ts` uses so
 * the new cookie value is visible to the destination page's own `cookies()` read immediately. */
export async function switchActiveMode(mode: SelectedRole) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (mode === "PARTNER" && session.user.partnerStatus !== "APPROVED") {
    redirect("/dashboard/become-provider");
  }

  const store = await cookies();
  store.set(SELECTED_ROLE_COOKIE, mode, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  redirect(mode === "PARTNER" ? "/partner" : "/dashboard");
}
