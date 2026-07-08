import { partnerRepository } from "@bikie/database";
import type { PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

export const PartnerService = {
  async getProfile(userId: string): Promise<PartnerProfileDTO | null> {
    return partnerRepository.findPartnerByUserId(userId);
  },

  async upsertProfile(
    userId: string,
    data: { businessName: string; type: string; city: string; description?: string },
  ): Promise<PartnerProfileDTO> {
    return partnerRepository.upsertPartnerProfile(userId, data);
  },

  async getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO> {
    return partnerRepository.getPartnerDashboardStats(userId);
  },
};
