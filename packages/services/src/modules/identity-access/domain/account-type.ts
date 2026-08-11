export const ACCOUNT_TYPES = ["RIDER", "SERVICE_PROVIDER"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** ADR-053 — the one formula every routing/nav call site reads instead of its own inline
 * capability check (middleware, Navbar, layouts, mobile role_provider/app_shell/app_router).
 * Deliberately ignores verification/membership — "which UI" is a different question from "is
 * this account operational," see `evaluatePartnerCapability`/`hasPartnerCapabilitySync` for that. */
export function isServiceProviderAccountType(
  session: { accountType?: string | null } | null | undefined,
): boolean {
  return session?.accountType === "SERVICE_PROVIDER";
}
