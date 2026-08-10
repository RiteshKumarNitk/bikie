import { getPartnersModule } from "./modules/partners/public";
import type { NearbyPartnerRow, UpsertProfileResult, SubmitApplicationResult, ReapplyResult } from "./modules/partners/public";
import type { PartnerApplicationDTO, PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

export type PartnerProfileWriteInput = {
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
  // --- ADR-046b ---
  profilePhotoUrl?: string;
  shopPhotoUrls?: string[];
  identityDocumentUrl?: string;
  businessDocumentUrl?: string;
};

/** Compatibility facade — routes keep importing PartnerService. */
export const PartnerService = {
  async getProfile(userId: string): Promise<PartnerProfileDTO | null> {
    return getPartnersModule().partners.getProfile(userId);
  },

  async upsertProfile(userId: string, data: PartnerProfileWriteInput): Promise<PartnerProfileDTO> {
    return getPartnersModule().partners.upsertProfile(userId, data);
  },

  /** ADR-046b — the guarded write `PUT /api/partner/profile` calls: refuses while the
   * application is PENDING_VERIFICATION/APPROVED/SUSPENDED (must go through an explicit
   * transition first). */
  async upsertProfileIfEditable(userId: string, data: PartnerProfileWriteInput): Promise<UpsertProfileResult> {
    return getPartnersModule().partners.upsertProfileIfEditable(userId, data);
  },

  /** `GET /api/partner/application` — the one read the "Become a Service Provider" flow polls. */
  async getApplication(userId: string): Promise<PartnerApplicationDTO> {
    return getPartnersModule().partners.getApplication(userId);
  },

  /** DRAFT | MORE_INFORMATION_REQUIRED -> PENDING_VERIFICATION. */
  async submitApplication(userId: string): Promise<SubmitApplicationResult> {
    return getPartnersModule().partners.submitApplication(userId);
  },

  /** REJECTED -> DRAFT, keeping previously-entered fields as an editable starting point. */
  async reapply(userId: string): Promise<ReapplyResult> {
    return getPartnersModule().partners.reapply(userId);
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

  /** §25 — the provider's own Rider → Service Provider service reviews (from SOS assistance
   * ratings), newest first. */
  async getProviderReviews(userId: string) {
    return getPartnersModule().partners.getProviderReviews(userId);
  },
};
