import { destinationRepository } from "@bikie/database";
import type { DestinationDetailDTO, DestinationSummaryDTO } from "@bikie/types";

export const DestinationService = {
  async getPopular(limit: number): Promise<DestinationSummaryDTO[]> {
    return destinationRepository.findPopularDestinations(limit);
  },

  async getAll(): Promise<DestinationSummaryDTO[]> {
    return destinationRepository.findAllDestinations();
  },

  async getBySlug(slug: string): Promise<DestinationDetailDTO | null> {
    return destinationRepository.findDestinationBySlug(slug);
  },
};
