/** Mute policy — matches MessageService.sendMessage gate. */
export function isAccountMuted(input: {
  accountStatus?: string | null;
  accountStatusExpiresAt?: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  return (
    input.accountStatus === "MUTED" &&
    (!input.accountStatusExpiresAt || input.accountStatusExpiresAt.getTime() > now.getTime())
  );
}
