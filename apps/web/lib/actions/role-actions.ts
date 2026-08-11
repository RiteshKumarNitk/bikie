"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIdentityAccessModule } from "@bikie/services";
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

/** ADR-046b — the post-auth "Switch Mode" control. Server-verifies CAPABILITY (ADR-049: an active
 * profile + active membership — not verification/`APPROVED`) before allowing PARTNER, never
 * trusting the client to only call this when it's actually entitled, and redirects straight to
 * the target dashboard, same round-trip-a-redirect approach `middleware.ts` uses so the new
 * cookie value is visible to the destination page's own `cookies()` read immediately. This is the
 * one mode-routing path that's allowed the extra membership DB round-trip `resolveActiveMode`/
 * `middleware.ts` deliberately skip — it only runs on a deliberate button press, not every
 * request. */
export async function switchActiveMode(mode: SelectedRole) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  if (mode === "PARTNER") {
    const { access } = getIdentityAccessModule();
    const decision = await access.evaluatePartnerCapability({
      userId: session.user.id,
      role: session.user.role,
      accountStatus: session.user.accountStatus,
      accountStatusExpiresAt: session.user.accountStatusExpiresAt,
      partnerStatus: session.user.partnerStatus,
    });
    if (!decision.allowed) {
      // ADR-051 — Service Providers have their own membership, not the Rider one.
      redirect(decision.reason === "MEMBERSHIP_REQUIRED" ? "/partner/membership" : "/dashboard/become-provider");
    }
  }

  const store = await cookies();
  store.set(SELECTED_ROLE_COOKIE, mode, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  redirect(mode === "PARTNER" ? "/partner" : "/dashboard");
}
