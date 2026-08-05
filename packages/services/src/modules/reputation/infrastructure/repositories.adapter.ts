import { reputationRepository } from "@bikie/database";
import type { ReputationRepositoryPort } from "../ports";

export function createReputationRepositoryAdapter(): ReputationRepositoryPort {
  return {
    recordAssist: (userId) => reputationRepository.recordAssist(userId),
    recordRating: (userId, rating) => reputationRepository.recordRating(userId, rating),
    getStats: (userId) => reputationRepository.getStats(userId),
  };
}
