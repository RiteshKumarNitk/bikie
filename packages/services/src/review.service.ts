import {
  getRentalsBookingsModule,
  type CreateReviewResult,
} from "./modules/rentals-bookings/public";
import type { ReviewDTO } from "@bikie/types";
import type { CreateReviewInput } from "@bikie/validation";

export type { CreateReviewResult };

/** Compatibility facade — routes keep importing ReviewService. */
export const ReviewService = {
  async getForBike(bikeId: string): Promise<ReviewDTO[]> {
    return getRentalsBookingsModule().reviews.getForBike(bikeId);
  },

  async getForUser(userId: string): Promise<ReviewDTO[]> {
    return getRentalsBookingsModule().reviews.getForUser(userId);
  },

  async getForOwner(ownerId: string): Promise<ReviewDTO[]> {
    return getRentalsBookingsModule().reviews.getForOwner(ownerId);
  },

  async create(userId: string, bikeId: string, input: CreateReviewInput): Promise<CreateReviewResult> {
    return getRentalsBookingsModule().reviews.create(userId, bikeId, input);
  },
};
