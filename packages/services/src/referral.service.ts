import { referralRepository } from "@bikie/database";
import type { ReferralInfoDTO } from "@bikie/types";

export const ReferralService = {
  async getMyReferralInfo(userId: string): Promise<ReferralInfoDTO> {
    const [code, referrals] = await Promise.all([
      referralRepository.getOrCreateReferralCode(userId),
      referralRepository.getMyReferrals(userId),
    ]);
    return { code, referrals };
  },

  async linkReferral(userId: string, code: string): Promise<boolean> {
    return referralRepository.linkReferral(userId, code.trim().toUpperCase());
  },
};
