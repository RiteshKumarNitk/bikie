import type { BookingDTO } from "@bikie/types";
import type { CreateBookingInput } from "@bikie/validation";
import {
  computeBookingTotal,
  initialBookingStatus,
  isValidBookingDateRange,
} from "../domain/pricing";
import type { RentalsBookingsPorts } from "../ports";

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; reason: "BIKE_NOT_FOUND" | "INVALID_DATES" | "BIKE_UNAVAILABLE" };

export function createBookingApplication(ports: RentalsBookingsPorts) {
  return {
    getForUser(userId: string, status?: string) {
      return ports.bookings.findByUser(userId, status);
    },

    getForPartner(ownerId: string) {
      return ports.bookings.findForPartner(ownerId);
    },

    async create(userId: string, input: CreateBookingInput): Promise<CreateBookingResult> {
      const bike = await ports.bikes.findForBooking(input.bikeId);
      if (!bike) return { ok: false, reason: "BIKE_NOT_FOUND" };

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      if (!isValidBookingDateRange(startDate, endDate)) {
        return { ok: false, reason: "INVALID_DATES" };
      }

      const totalPrice = computeBookingTotal(bike.pricePerDay, startDate, endDate);
      const status = initialBookingStatus(bike.instantBooking);

      const booking = await ports.bookings.createIfAvailable({
        userId,
        bikeId: input.bikeId,
        startDate,
        endDate,
        pickupCity: input.pickupCity,
        totalPrice,
        status,
      });
      if (!booking) return { ok: false, reason: "BIKE_UNAVAILABLE" };
      return { ok: true, booking };
    },
  };
}

export type BookingApplication = ReturnType<typeof createBookingApplication>;
