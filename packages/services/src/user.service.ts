import { userRepository, partnerRepository } from "@bikie/database";

export type BecomePartnerResult =
  | { ok: true }
  | { ok: false; reason: "ALREADY_PARTNER_OR_ADMIN" };

export const UserService = {
  async phoneNumberExists(phoneNumber: string): Promise<{ exists: boolean; hasRealName: boolean }> {
    const user = await userRepository.findUserByPhoneNumber(phoneNumber);
    if (!user) return { exists: false, hasRealName: false };
    return { exists: true, hasRealName: user.name !== phoneNumber };
  },

  async becomePartner(
    userId: string,
    currentRole: string,
    profile: {
      businessName: string;
      type: string;
      city: string;
      description?: string;
      aadhaarNumber?: string;
      contactPerson1Name?: string;
      contactPerson1Mobile?: string;
      contactPerson2Name?: string;
      contactPerson2Mobile?: string;
    },
  ): Promise<BecomePartnerResult> {
    if (currentRole === "PARTNER" || currentRole === "ADMIN") {
      return { ok: false, reason: "ALREADY_PARTNER_OR_ADMIN" };
    }
    await userRepository.upgradeToPartnerRole(userId);
    await partnerRepository.upsertPartnerProfile(userId, profile);
    return { ok: true };
  },

  /**
   * Called once, right after a brand-new phone-OTP account's first verification —
   * Better Auth's `signUpOnVerification` creates the row with a placeholder name (the raw
   * phone number, see `getTempName` in packages/auth/src/server.ts) and always defaults
   * `role` to RENTER, since passing extra fields through the OTP `verify` call isn't a
   * type-safe path worth relying on. This sets the real name, and — only on that same
   * first call, detected by the name still being the untouched placeholder — applies the
   * role the user actually picked on /welcome. Calling this again later just renames the
   * account; it can never be used to change role after the fact (use /api/user/become-partner
   * for that, which has its own explicit guard).
   */
  async completePhoneSignup(
    userId: string,
    input: { name: string; role: "RENTER" | "PARTNER" },
  ): Promise<{ ok: true; becamePartner: boolean } | { ok: false; reason: "NOT_FOUND" }> {
    const user = await userRepository.findById(userId);
    if (!user) return { ok: false, reason: "NOT_FOUND" };

    const isFirstCompletion = user.phoneNumber !== null && user.name === user.phoneNumber;
    await userRepository.updateName(userId, input.name);

    const becamePartner = isFirstCompletion && input.role === "PARTNER" && user.role !== "PARTNER";
    if (becamePartner) {
      await userRepository.upgradeToPartnerRole(userId);
    }
    return { ok: true, becamePartner };
  },
};
