"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SELECTED_ROLE_COOKIE, isSafeNext, type SelectedRole } from "@/lib/role";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Sets the pre-auth site-experience cookie and redirects. Used by the
 * /welcome gate and the nav's "Switch to Rider/Service Provider" affordance. Not
 * httpOnly — the signup page (a client component) reads it to seed which
 * role's fields to render, and it carries no sensitive data (just a UI
 * preference, "RIDER" or "SERVICE_PROVIDER").
 *
 * Per ADR-014, picking a role on /welcome no longer drops the visitor straight onto the
 * homepage/marketing page — both roles now go to /login by default (which already offers a
 * "no account yet? sign up" fallback), so a role is chosen and then the visitor authenticates
 * before seeing any dashboard content. An explicit `next` is still honored as-is.
 *
 * ADR-053 — this cookie is pre-auth only now. The post-auth "Switch Mode" control
 * (`switchActiveMode`) that used to live in this file is retired along with the dual-capability
 * model it belonged to: a signed-in account's `accountType` is server-authoritative and only
 * ever changed by an admin-approved Account Type Change Request
 * (`AccountTypeRequestService`/`/account-type-request`), never a self-service switch. */
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
