/**
 * Moderation fast-path policy. BANNED is permanent; SUSPENDED lifts once
 * `accountStatusExpiresAt` has passed. A missing expiry means the suspension never expires.
 */
export type AccountStatusSnapshot = {
  status?: string | null;
  expiresAt?: string | Date | null;
};

export function isAccountRestricted(
  { status, expiresAt }: AccountStatusSnapshot,
  now: Date = new Date(),
): boolean {
  const isExpired = expiresAt ? new Date(expiresAt).getTime() < now.getTime() : false;
  return status === "BANNED" || (status === "SUSPENDED" && !isExpired);
}
