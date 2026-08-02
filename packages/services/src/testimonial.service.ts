import { getCatalogModule } from "./modules/catalog/public";
import type { TestimonialDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing TestimonialService. */
export const TestimonialService = {
  async getFeatured(limit: number): Promise<TestimonialDTO[]> {
    return getCatalogModule().testimonials.getFeatured(limit);
  },
};
