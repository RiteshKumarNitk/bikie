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
  | "PARTNER_NOT_APPROVED"
  // ADR-053 — the caller's accountType isn't SERVICE_PROVIDER at all (a Rider account, possibly
  // with a historical Partner profile from a prior stint). Distinct from PARTNER_NOT_APPROVED:
  // this is "wrong account type," not "no application" — the fix is switching account type, not
  // starting an application.
  | "WRONG_ACCOUNT_TYPE";

export type AccessDecision = { allowed: true } | { allowed: false; reason: AccessDenialReason };

export const ALLOWED: AccessDecision = { allowed: true };

export function denied(reason: AccessDenialReason): AccessDecision {
  return { allowed: false, reason };
}
