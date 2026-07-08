import { reviewRepository } from "@bikie/database";
import type { ReviewDTO } from "@bikie/types";

export const ReviewService = {
  async getForBike(bikeId: string): Promise<ReviewDTO[]> {
    return reviewRepository.findReviewsForBike(bikeId);
  },

  async getForUser(userId: string): Promise<ReviewDTO[]> {
    return reviewRepository.findReviewsByUser(userId);
  },

  async getForOwner(ownerId: string): Promise<ReviewDTO[]> {
    return reviewRepository.findReviewsForOwner(ownerId);
  },
};
