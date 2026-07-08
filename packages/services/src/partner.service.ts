import { partnerRepository } from "@bikie/database";
import type { PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

export const PartnerService = {
  async getProfile(userId: string): Promise<PartnerProfileDTO | null> {
    return partnerRepository.findPartnerByUserId(userId);
  },

  async getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO> {
    return partnerRepository.getPartnerDashboardStats(userId);
  },
};
