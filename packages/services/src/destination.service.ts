import { destinationRepository } from "@bikie/database";
import type { DestinationSummaryDTO } from "@bikie/types";

export const DestinationService = {
  async getPopular(limit: number): Promise<DestinationSummaryDTO[]> {
    return destinationRepository.findPopularDestinations(limit);
  },
};
