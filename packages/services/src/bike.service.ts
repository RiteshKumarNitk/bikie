import { bikeRepository } from "@bikie/database";
import type { BikeDetailDTO, BikeSearchParams, BikeSearchResultDTO, BikeSummaryDTO } from "@bikie/types";

export const BikeService = {
  async getFeatured(limit: number): Promise<BikeSummaryDTO[]> {
    return bikeRepository.findFeaturedBikes(limit);
  },

  async search(params: BikeSearchParams): Promise<BikeSearchResultDTO> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;
    const { bikes, total } = await bikeRepository.searchBikes({ ...params, page, pageSize });
    return { bikes, total, page, pageSize };
  },

  async getBySlug(slug: string): Promise<BikeDetailDTO | null> {
    return bikeRepository.findBikeBySlug(slug);
  },

  async getByOwner(ownerId: string): Promise<BikeSummaryDTO[]> {
    return bikeRepository.findBikesByOwner(ownerId);
  },
};
