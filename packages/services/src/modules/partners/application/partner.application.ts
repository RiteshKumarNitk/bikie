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
  };
}

export type PartnerApplication = ReturnType<typeof createPartnerApplication>;
