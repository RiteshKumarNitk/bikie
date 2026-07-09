import { bikeRepository, bookingRepository } from "@bikie/database";
import type { BookingDTO } from "@bikie/types";
import type { CreateBookingInput } from "@bikie/validation";

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; reason: "BIKE_NOT_FOUND" | "INVALID_DATES" };

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export const BookingService = {
  async getForUser(userId: string, status?: string): Promise<BookingDTO[]> {
    return bookingRepository.findBookingsByUser(userId, status);
  },

  async getForPartner(ownerId: string): Promise<BookingDTO[]> {
    return bookingRepository.findBookingsForPartnerBikes(ownerId);
  },

  async create(userId: string, input: CreateBookingInput): Promise<CreateBookingResult> {
    const bike = await bikeRepository.findBikeForBooking(input.bikeId);
    if (!bike) return { ok: false, reason: "BIKE_NOT_FOUND" };

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return { ok: false, reason: "INVALID_DATES" };
    }

    const totalPrice = bike.pricePerDay * daysBetween(startDate, endDate);
    const status = bike.instantBooking ? "CONFIRMED" : "PENDING";

    const booking = await bookingRepository.createBooking({
      userId,
      bikeId: input.bikeId,
      startDate,
      endDate,
      pickupCity: input.pickupCity,
      totalPrice,
      status,
    });
    return { ok: true, booking };
  },
};
