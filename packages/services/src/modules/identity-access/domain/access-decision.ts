/**
 * Transport-neutral authorization outcome. The web layer maps each reason to the HTTP
 * status/body it has always returned; the policy itself knows nothing about Next.js.
 */
export type AccessDenialReason =
  | "UNAUTHENTICATED"
  | "ACCOUNT_RESTRICTED"
  | "FORBIDDEN"
  | "MEMBERSHIP_REQUIRED";

export type AccessDecision = { allowed: true } | { allowed: false; reason: AccessDenialReason };

export const ALLOWED: AccessDecision = { allowed: true };

export function denied(reason: AccessDenialReason): AccessDecision {
  return { allowed: false, reason };
}
