import { userRepository } from "@bikie/database";

/** ADR-053 — how long after account creation `completePhoneSignup` is still allowed to set
 * `accountType`. Generous enough for a slow onboarding form, tight enough that it can't be used
 * as a delayed self-service switch against an established account. */
const SIGNUP_WINDOW_MS = 10 * 60 * 1000;

export const UserService = {
  async phoneNumberExists(phoneNumber: string): Promise<{ exists: boolean; hasRealName: boolean }> {
    const user = await userRepository.findUserByPhoneNumber(phoneNumber);
    if (!user) return { exists: false, hasRealName: false };
    return { exists: true, hasRealName: user.name !== phoneNumber };
  },

  async updatePhone(userId: string, phone: string | null): Promise<void> {
    await userRepository.updatePhone(userId, phone);
  },

  async touchLastActiveAt(userId: string): Promise<void> {
    await userRepository.touchLastActiveAt(userId);
  },

  /**
   * Called once, right after a brand-new phone-OTP account's first verification — Better
   * Auth's `signUpOnVerification` creates the row with a placeholder name (the raw phone
   * number, see `getTempName` in packages/auth/src/server.ts). Applies the real name once it's
   * collected on the onboarding form (via `authClient.updateUser`, not here — `name` is only
   * accepted for backward compatibility with any other caller that still wants to set it in the
   * same step).
   *
   * ADR-046b: no longer touches `role`. Every account is RENTER by default and stays that way —
   * the `role` field some older/in-flight clients still send here is accepted and ignored.
   *
   * ADR-053: registration is the ONE free choice point for `accountType` — after this, changing
   * it needs an admin-approved Account Type Change Request, never a bare API call. Guarded by
   * account age (`SIGNUP_WINDOW_MS`) rather than a one-shot flag: this endpoint is only ever
   * meant to fire once, in the same request flow as account creation, so a call against an
   * account older than the window is treated as a (possibly malicious) replay against an
   * *existing* account and its accountType is left untouched.
   */
  async completePhoneSignup(
    userId: string,
    input: { name?: string; accountType?: "RIDER" | "SERVICE_PROVIDER" },
  ): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
    const user = await userRepository.findById(userId);
    if (!user) return { ok: false, reason: "NOT_FOUND" };

    if (input.name) {
      await userRepository.updateName(userId, input.name);
    }
    const isBrandNewAccount = Date.now() - user.createdAt.getTime() < SIGNUP_WINDOW_MS;
    if (input.accountType && isBrandNewAccount) {
      await userRepository.setAccountType(userId, input.accountType);
    }
    return { ok: true };
  },
};
