import { getPartnersModule } from "./modules/partners/public";
import type { NearbyPartnerRow } from "./modules/partners/public";
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
      contactPerson1Name?: string;
      contactPerson1Mobile?: string;
      contactPerson2Name?: string;
      contactPerson2Mobile?: string;
      addressLine?: string;
      area?: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
      governmentIdType?: string;
      governmentIdNumber?: string;
      isGeneralResponder?: boolean;
    },
  ): Promise<PartnerProfileDTO> {
    return getPartnersModule().partners.upsertProfile(userId, data);
  },

  async getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO> {
    return getPartnersModule().partners.getDashboardStats(userId);
  },

  /** Public "find a service provider near me" — verified partners with a set map pin, within
   * `radiusMeters` of a point. Backs GET /api/partners/nearby (ADR-036). */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    options?: { type?: string; take?: number },
  ): Promise<NearbyPartnerRow[]> {
    return getPartnersModule().partners.findNearby(latitude, longitude, radiusMeters, options);
  },

  /** ADR-044 — the SOS-availability toggle. */
  async setAvailability(userId: string, isAvailable: boolean): Promise<{ isAvailable: boolean }> {
    return getPartnersModule().partners.setAvailability(userId, isAvailable);
  },
};
