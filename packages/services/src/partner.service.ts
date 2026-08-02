import { getPartnersModule } from "./modules/partners/public";
import type { PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing PartnerService. */
export const PartnerService = {
  async getProfile(userId: string): Promise<PartnerProfileDTO | null> {
    return getPartnersModule().partners.getProfile(userId);
  },

  async upsertProfile(
    userId: string,
    data: {
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
  ): Promise<PartnerProfileDTO> {
    return getPartnersModule().partners.upsertProfile(userId, data);
  },

  async getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO> {
    return getPartnersModule().partners.getDashboardStats(userId);
  },
};
