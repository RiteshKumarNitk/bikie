export const SELECTED_ROLE_COOKIE = "selectedRole";

export type SelectedRole = "RIDER" | "PARTNER";

/** Maps the DB `User.role` enum onto the pre-auth site-experience cookie.
 * Decoupled on purpose — ADMIN has no dedicated public site, so admins get
 * the rider experience outside of /admin. */
export function dbRoleToSelectedRole(dbRole: string | undefined): SelectedRole {
  return dbRole === "PARTNER" ? "PARTNER" : "RIDER";
}

export function selectedRoleToDbRole(role: SelectedRole): "RENTER" | "PARTNER" {
  return role === "PARTNER" ? "PARTNER" : "RENTER";
}

export function isSelectedRole(value: string | undefined | null): value is SelectedRole {
  return value === "RIDER" || value === "PARTNER";
}

/** Only allow same-origin relative paths as a post-selection redirect target. */
export function isSafeNext(next: string | undefined | null): next is string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//");
}
