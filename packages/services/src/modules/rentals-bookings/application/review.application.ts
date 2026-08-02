import type { ReviewDTO } from "@bikie/types";
import type { CreateReviewInput } from "@bikie/validation";
import { evaluateReviewEligibility } from "../domain/review-eligibility";
import type { RentalsBookingsPorts } from "../ports";

export type CreateReviewResult =
  | { ok: true; review: ReviewDTO }
  | { ok: false; reason: "BOOKING_NOT_FOUND" | "NOT_ELIGIBLE" | "ALREADY_REVIEWED" };

export function createReviewApplication(ports: RentalsBookingsPorts) {
  return {
    getForBike(bikeId: string) {
      return ports.reviews.findForBike(bikeId);
    },

    getForUser(userId: string) {
      return ports.reviews.findForUser(userId);
    },

    getForOwner(ownerId: string) {
      return ports.reviews.findForOwner(ownerId);
    },

    async create(
      userId: string,
      bikeId: string,
      input: CreateReviewInput,
    ): Promise<CreateReviewResult> {
      const booking = await ports.bookings.findById(input.bookingId);
      const existing = await ports.reviews.findByBookingId(input.bookingId);
      const eligibility = evaluateReviewEligibility({
        booking,
        userId,
        bikeId,
        alreadyReviewed: Boolean(existing),
      });
      if (!eligibility.ok) return eligibility;

      const review = await ports.reviews.create({
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
}

export type ReviewApplication = ReturnType<typeof createReviewApplication>;
