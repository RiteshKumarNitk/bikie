export const SELECTED_ROLE_COOKIE = "selectedRole";

export type SelectedRole = "RIDER" | "PARTNER";

/**
 * Pre-auth: which forms/copy `/signup` and `/login` show, seeded by `/welcome`'s choice.
 * Post-auth (ADR-046b): repurposed as the dual-capability "active mode" switch — which
 * dashboard (`/dashboard` vs `/partner`) a capable account currently wants to see, set via
 * `switchActiveMode()` (`lib/actions/role-actions.ts`). One cookie, two lifecycle phases, same
 * "which experience do I want" concept throughout — see DECISIONS.md ADR-046b for why this
 * wasn't split into a second cookie.
 */

/** Derives a starting mode when no cookie is present yet (first-ever visit, or a fresh/cleared
 * session). Defaults to PARTNER only when the account actually has Service Provider CAPABILITY —
 * every other case falls back to RIDER, the universal baseline every account has.
 *
 * ADR-049: capability is decoupled from verification — a Service Provider profile exists
 * (`partnerStatus` is set at all) and hasn't been `SUSPENDED`. `DRAFT`/`PENDING_VERIFICATION`/
 * `MORE_INFORMATION_REQUIRED`/`REJECTED`/`APPROVED` all still resolve to PARTNER mode being
 * available; only a genuinely absent profile or an explicit suspension falls back to RIDER. This
 * is the cheap, session-only check (no membership lookup — see
 * `evaluatePartnerCapability`/`hasPartnerCapabilitySync` in `identity-access` for why that's
 * deliberately not done here, on a path evaluated on every request/render). */
export function resolveActiveMode(partnerStatus: string | null | undefined): SelectedRole {
  return partnerStatus != null && partnerStatus !== "SUSPENDED" ? "PARTNER" : "RIDER";
}

export function isSelectedRole(value: string | undefined | null): value is SelectedRole {
  return value === "RIDER" || value === "PARTNER";
}

/** Only allow same-origin relative paths as a post-selection redirect target. */
export function isSafeNext(next: string | undefined | null): next is string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//");
}
