import { getCatalogModule } from "./modules/catalog/public";
import type { BikeDetailDTO, BikeSearchParams, BikeSearchResultDTO, BikeSummaryDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing BikeService. */
export const BikeService = {
  async getFeatured(limit: number): Promise<BikeSummaryDTO[]> {
    return getCatalogModule().bikes.getFeatured(limit);
  },

  async search(params: BikeSearchParams): Promise<BikeSearchResultDTO> {
    return getCatalogModule().bikes.search(params);
  },

  async getBySlug(slug: string): Promise<BikeDetailDTO | null> {
    return getCatalogModule().bikes.getBySlug(slug);
  },

  async getByOwner(ownerId: string): Promise<BikeSummaryDTO[]> {
    return getCatalogModule().bikes.getByOwner(ownerId);
  },
};
