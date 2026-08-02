import { getRentalsBookingsModule } from "./modules/rentals-bookings/public";
import type { WishlistItemDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing WishlistService. */
export const WishlistService = {
  async getForUser(userId: string): Promise<WishlistItemDTO[]> {
    return getRentalsBookingsModule().wishlist.getForUser(userId);
  },

  async add(userId: string, bikeId: string): Promise<void> {
    await getRentalsBookingsModule().wishlist.add(userId, bikeId);
  },

  async remove(userId: string, bikeId: string): Promise<void> {
    await getRentalsBookingsModule().wishlist.remove(userId, bikeId);
  },
};
