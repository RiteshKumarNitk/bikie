export type ReviewEligibilityReason = "BOOKING_NOT_FOUND" | "NOT_ELIGIBLE" | "ALREADY_REVIEWED";

export type ReviewEligibility =
  | { ok: true }
  | { ok: false; reason: ReviewEligibilityReason };

/**
 * A booking may be reviewed only by its renter, for the bike it was on, once it is
 * COMPLETED, and only once. ALREADY_REVIEWED is checked by the caller against the
 * review repository — this function covers the booking-side rules.
 */
export function evaluateReviewEligibility(input: {
  booking: { userId: string; bikeId: string; status: string } | null;
  userId: string;
  bikeId: string;
  alreadyReviewed: boolean;
}): ReviewEligibility {
  if (!input.booking) return { ok: false, reason: "BOOKING_NOT_FOUND" };
  if (
    input.booking.userId !== input.userId ||
    input.booking.bikeId !== input.bikeId ||
    input.booking.status !== "COMPLETED"
  ) {
    return { ok: false, reason: "NOT_ELIGIBLE" };
  }
  if (input.alreadyReviewed) return { ok: false, reason: "ALREADY_REVIEWED" };
  return { ok: true };
}
