import {
  getRentalsBookingsModule,
  type CreateBookingResult,
} from "./modules/rentals-bookings/public";
import type { BookingDTO } from "@bikie/types";
import type { CreateBookingInput } from "@bikie/validation";

export type { CreateBookingResult };

/** Compatibility facade — routes keep importing BookingService. */
export const BookingService = {
  async getForUser(userId: string, status?: string): Promise<BookingDTO[]> {
    return getRentalsBookingsModule().bookings.getForUser(userId, status);
  },

  async getForPartner(ownerId: string): Promise<BookingDTO[]> {
    return getRentalsBookingsModule().bookings.getForPartner(ownerId);
  },

  async create(userId: string, input: CreateBookingInput): Promise<CreateBookingResult> {
    return getRentalsBookingsModule().bookings.create(userId, input);
  },
};
