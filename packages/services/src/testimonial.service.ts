import { testimonialRepository } from "@bikie/database";
import type { TestimonialDTO } from "@bikie/types";

export const TestimonialService = {
  async getFeatured(limit: number): Promise<TestimonialDTO[]> {
    return testimonialRepository.findFeaturedTestimonials(limit);
  },
};
