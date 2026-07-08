import { bookingRepository } from "@bikie/database";
import type { BookingDTO } from "@bikie/types";

export const BookingService = {
  async getForUser(userId: string, status?: string): Promise<BookingDTO[]> {
    return bookingRepository.findBookingsByUser(userId, status);
  },

  async getForPartner(ownerId: string): Promise<BookingDTO[]> {
    return bookingRepository.findBookingsForPartnerBikes(ownerId);
  },
};
