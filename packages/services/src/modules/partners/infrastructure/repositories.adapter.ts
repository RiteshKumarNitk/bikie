import { partnerRepository } from "@bikie/database";
import type { PartnerRepositoryPort } from "../ports";

export function createPartnerRepositoryAdapter(): PartnerRepositoryPort {
  return {
    findByUserId: (userId) => partnerRepository.findPartnerByUserId(userId),
    upsertProfile: (userId, data) => partnerRepository.upsertPartnerProfile(userId, data),
    upsertProfileIfEditable: async (userId, data) => {
      const result = await partnerRepository.upsertPartnerProfileIfEditable(userId, data);
      return result.ok ? { ok: true, profile: result.partner } : result;
    },
    submitApplication: async (userId) => {
      const result = await partnerRepository.submitPartnerApplication(userId);
      return result.ok ? { ok: true, profile: result.partner } : result;
    },
    reapply: async (userId) => {
      const result = await partnerRepository.reapplyPartner(userId);
      return result.ok ? { ok: true, profile: result.partner } : result;
    },
    getDashboardStats: (userId) => partnerRepository.getPartnerDashboardStats(userId),
    findNearby: (latitude, longitude, radiusMeters, options) =>
      partnerRepository.findPartnersNearPoint(latitude, longitude, radiusMeters, options),
    setAvailability: (userId, isAvailable) => partnerRepository.setAvailability(userId, isAvailable),
  };
}
