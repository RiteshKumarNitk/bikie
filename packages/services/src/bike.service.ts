import { bikeRepository } from "@bikie/database";
import type { BikeSummaryDTO } from "@bikie/types";

export const BikeService = {
  async getFeatured(limit: number): Promise<BikeSummaryDTO[]> {
    return bikeRepository.findFeaturedBikes(limit);
  },
};
