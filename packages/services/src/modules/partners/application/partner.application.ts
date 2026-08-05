import type { PartnerProfileInput, PartnersPorts } from "../ports";

export function createPartnerApplication(ports: PartnersPorts) {
  return {
    getProfile(userId: string) {
      return ports.partners.findByUserId(userId);
    },

    upsertProfile(userId: string, data: PartnerProfileInput) {
      return ports.partners.upsertProfile(userId, data);
    },

    getDashboardStats(userId: string) {
      return ports.partners.getDashboardStats(userId);
    },

    findNearby(latitude: number, longitude: number, radiusMeters: number, options?: { type?: string; take?: number }) {
      return ports.partners.findNearby(latitude, longitude, radiusMeters, options);
    },
  };
}

export type PartnerApplication = ReturnType<typeof createPartnerApplication>;
