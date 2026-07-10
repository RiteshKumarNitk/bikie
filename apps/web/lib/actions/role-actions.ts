"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SELECTED_ROLE_COOKIE, homeHrefForRole, isSafeNext, type SelectedRole } from "@/lib/role";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Sets the pre-auth site-experience cookie and redirects. Used by the
 * /welcome gate and the nav's "Switch to Rider/Partner" affordance. Not
 * httpOnly — the signup page (a client component) reads it to seed which
 * role's fields to render, and it carries no sensitive data (just a UI
 * preference, "RIDER" or "PARTNER"). */
export async function selectRole(role: SelectedRole, next?: string) {
  const store = await cookies();
  store.set(SELECTED_ROLE_COOKIE, role, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  redirect(isSafeNext(next) ? next : homeHrefForRole(role));
}
