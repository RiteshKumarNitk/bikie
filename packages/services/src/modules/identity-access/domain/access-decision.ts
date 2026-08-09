/**
 * Transport-neutral authorization outcome. The web layer maps each reason to the HTTP
 * status/body it has always returned; the policy itself knows nothing about Next.js.
 */
export type AccessDenialReason =
  | "UNAUTHENTICATED"
  | "ACCOUNT_RESTRICTED"
  | "FORBIDDEN"
  | "MEMBERSHIP_REQUIRED"
  // ADR-046b — the caller has no APPROVED Partner application (never had one, or it was
  // rejected/suspended/still pending) — distinct from FORBIDDEN so callers can point the user
  // at the application flow instead of a bare "no access" message.
  | "PARTNER_NOT_APPROVED";

export type AccessDecision = { allowed: true } | { allowed: false; reason: AccessDenialReason };

export const ALLOWED: AccessDecision = { allowed: true };

export function denied(reason: AccessDenialReason): AccessDecision {
  return { allowed: false, reason };
}
