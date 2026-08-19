import { userRepository } from "@bikie/database";

/** ADR-053 — how long after account creation `completePhoneSignup` is still allowed to set
 * `accountType`. Generous enough for a slow onboarding form, tight enough that it can't be used
 * as a delayed self-service switch against an established account. */
const SIGNUP_WINDOW_MS = 10 * 60 * 1000;

export const UserService = {
  /** `accountType` lets the login/signup UI detect a Rider-vs-Service-Provider mismatch and show
   * the "already registered as X" choice BEFORE ever sending an OTP (ADR-053) — no reason to
   * text a code just to find out the selection doesn't match the account. `null` when the number
   * has no account yet. */
  async phoneNumberExists(
    phoneNumber: string,
  ): Promise<{ exists: boolean; hasRealName: boolean; accountType: "RIDER" | "SERVICE_PROVIDER" | null }> {
    const user = await userRepository.findUserByPhoneNumber(phoneNumber);
    if (!user) return { exists: false, hasRealName: false, accountType: null };
    return { exists: true, hasRealName: user.name !== phoneNumber, accountType: user.accountType };
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
   * ADR-055: the `role` field some older/in-flight clients still send here is accepted and
   * ignored — but `role` is no longer *frozen* at RENTER either. `setAccountType` below writes
   * it alongside `accountType` (SERVICE_PROVIDER -> PARTNER), so the account type chosen at
   * registration and the role shown in `/admin/users` can never disagree.
   *
   * ADR-053: registration is the ONE free choice point for `accountType` — after this, changing
   * it needs an admin-approved Account Type Change Request, never a bare API call. Guarded by
   * account age (`SIGNUP_WINDOW_MS`) OR the still-placeholder name: an account whose name is
   * still its raw phone number has never completed onboarding, so it's still in the
   * "registration" phase no matter how long it's been since the OTP verify created it (a slow
   * form, a retry after a failed page load, or a user who verified and came back later must not
   * silently end up as the wrong type). A call against an *established* account (real name set)
   * outside the window is treated as a (possibly malicious) replay and its accountType is left
   * untouched.
   */
  async completePhoneSignup(
    userId: string,
    input: { name?: string; accountType?: "RIDER" | "SERVICE_PROVIDER" },
  ): Promise<{ ok: true; accountTypeApplied: boolean } | { ok: false; reason: "NOT_FOUND" }> {
    const user = await userRepository.findById(userId);
    if (!user) return { ok: false, reason: "NOT_FOUND" };

    if (input.name) {
      await userRepository.updateName(userId, input.name);
    }
    // `user.name === user.phoneNumber` is the still-unclaimed signal: Better Auth's temp name
    // is the raw phone number, and it's only replaced by a real name on the onboarding form.
    const isPlaceholderName =
      user.name === user.phoneNumber || user.name === user.phoneNumber?.replace("+", "");
    const isBrandNewAccount =
      Date.now() - user.createdAt.getTime() < SIGNUP_WINDOW_MS || isPlaceholderName;

    if (input.accountType && isBrandNewAccount) {
      await userRepository.setAccountType(userId, input.accountType);
      return { ok: true, accountTypeApplied: true };
    }
    return { ok: true, accountTypeApplied: false };
  },
};
