import { userRepository } from "@bikie/database";

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
   * Service Provider capability is granted only through the Partner application/verification
   * flow (`PartnerService.getApplication`/`submitApplication`, `AdminService
   * .transitionPartnerVerification`), never by an instant role flip at signup. The `role` field
   * some older/in-flight clients still send here is accepted and ignored.
   */
  async completePhoneSignup(
    userId: string,
    input: { name?: string },
  ): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
    const user = await userRepository.findById(userId);
    if (!user) return { ok: false, reason: "NOT_FOUND" };

    if (input.name) {
      await userRepository.updateName(userId, input.name);
    }
    return { ok: true };
  },
};
