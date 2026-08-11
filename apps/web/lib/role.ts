export const SELECTED_ROLE_COOKIE = "selectedRole";

export type SelectedRole = "RIDER" | "SERVICE_PROVIDER";

/**
 * Pre-auth only (ADR-053): which forms/copy `/signup` and `/login` show, seeded by `/welcome`'s
 * choice, and what an existing account's `accountType` gets compared against on login/signup to
 * detect a mismatch. There is no post-auth "active mode" phase anymore — `session.user.accountType`
 * (server-authoritative, mutually exclusive) is the routing decision everywhere once signed in;
 * see `@bikie/services`'s `isServiceProviderAccountType`. This single-phase cookie replaces the
 * old two-phase one described in DECISIONS.md ADR-046b, retired by ADR-053.
 */

export function isSelectedRole(value: string | undefined | null): value is SelectedRole {
  return value === "RIDER" || value === "SERVICE_PROVIDER";
}

/** Only allow same-origin relative paths as a post-selection redirect target. */
export function isSafeNext(next: string | undefined | null): next is string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//");
}
