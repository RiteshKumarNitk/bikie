import type { PartnerProfileInput, PartnersPorts } from "../ports";

export function createPartnerApplication(ports: PartnersPorts) {
  return {
    getProfile(userId: string) {
      return ports.partners.findByUserId(userId);
    },

    upsertProfile(userId: string, data: PartnerProfileInput) {
      return ports.partners.upsertProfile(userId, data);
    },

    /** ADR-046b — the guarded write `PUT /api/partner/profile` calls. */
    upsertProfileIfEditable(userId: string, data: PartnerProfileInput) {
      return ports.partners.upsertProfileIfEditable(userId, data);
    },

    /** `GET /api/partner/application` — the one read the "Become a Service Provider" flow
     * polls. `status: "NOT_APPLIED"` (never stored) when there's no Partner row yet. */
    async getApplication(userId: string) {
      const profile = await ports.partners.findByUserId(userId);
      return { status: profile?.verificationStatus ?? ("NOT_APPLIED" as const), profile };
    },

    submitApplication(userId: string) {
      return ports.partners.submitApplication(userId);
    },

    reapply(userId: string) {
      return ports.partners.reapply(userId);
    },

    getDashboardStats(userId: string) {
      return ports.partners.getDashboardStats(userId);
    },

    findNearby(
      latitude: number,
      longitude: number,
      radiusMeters: number,
      options?: { type?: string; take?: number; eligibleOnly?: boolean },
    ) {
      return ports.partners.findNearby(latitude, longitude, radiusMeters, options);
    },

    setAvailability(userId: string, isAvailable: boolean) {
      return ports.partners.setAvailability(userId, isAvailable);
    },

    /** §25 — the provider's own Rider → Service Provider service reviews (from SOS assistance
     * ratings), newest first. Returns [] for a profile-less account. */
    async getProviderReviews(userId: string) {
      const profile = await ports.partners.findByUserId(userId);
      if (!profile) return [];
      return ports.partners.findProviderReviews(profile.id, 50);
    },
  };
}

export type PartnerApplication = ReturnType<typeof createPartnerApplication>;
