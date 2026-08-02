import { getCatalogModule } from "./modules/catalog/public";
import type { DestinationDetailDTO, DestinationSummaryDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing DestinationService. */
export const DestinationService = {
  async getPopular(limit: number): Promise<DestinationSummaryDTO[]> {
    return getCatalogModule().destinations.getPopular(limit);
  },

  async getAll(): Promise<DestinationSummaryDTO[]> {
    return getCatalogModule().destinations.getAll();
  },

  async getBySlug(slug: string): Promise<DestinationDetailDTO | null> {
    return getCatalogModule().destinations.getBySlug(slug);
  },
};
