/** Login OTP SMS copy — kept in the domain so the wording is testable without a provider. */
export function buildOtpMessage(code: string, expiresInSeconds: number): string {
  const minutes = Math.round(expiresInSeconds / 60);
  return `Your BIKIE verification code is ${code}. It expires in ${minutes} minutes.`;
}
