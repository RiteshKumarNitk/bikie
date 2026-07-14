import { bookingRepository, reviewRepository } from "@bikie/database";
import type { ReviewDTO } from "@bikie/types";
import type { CreateReviewInput } from "@bikie/validation";

export type CreateReviewResult =
  | { ok: true; review: ReviewDTO }
  | { ok: false; reason: "BOOKING_NOT_FOUND" | "NOT_ELIGIBLE" | "ALREADY_REVIEWED" };

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

  async create(userId: string, bikeId: string, input: CreateReviewInput): Promise<CreateReviewResult> {
    const booking = await bookingRepository.findBookingById(input.bookingId);
    if (!booking) return { ok: false, reason: "BOOKING_NOT_FOUND" };

    if (booking.userId !== userId || booking.bikeId !== bikeId || booking.status !== "COMPLETED") {
      return { ok: false, reason: "NOT_ELIGIBLE" };
    }

    const existing = await reviewRepository.findReviewByBookingId(input.bookingId);
    if (existing) return { ok: false, reason: "ALREADY_REVIEWED" };

    const review = await reviewRepository.createReview({
      userId,
      bikeId,
      bookingId: input.bookingId,
      rating: input.rating,
      comment: input.comment,
    });
    if (!review) return { ok: false, reason: "ALREADY_REVIEWED" };
    return { ok: true, review };
  },
};
