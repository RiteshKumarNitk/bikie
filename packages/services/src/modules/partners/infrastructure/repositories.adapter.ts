import { partnerRepository } from "@bikie/database";
import type { PartnerRepositoryPort } from "../ports";

export function createPartnerRepositoryAdapter(): PartnerRepositoryPort {
  return {
    findByUserId: (userId) => partnerRepository.findPartnerByUserId(userId),
    upsertProfile: (userId, data) => partnerRepository.upsertPartnerProfile(userId, data),
    getDashboardStats: (userId) => partnerRepository.getPartnerDashboardStats(userId),
    findNearby: (latitude, longitude, radiusMeters, options) =>
      partnerRepository.findPartnersNearPoint(latitude, longitude, radiusMeters, options),
  };
}
