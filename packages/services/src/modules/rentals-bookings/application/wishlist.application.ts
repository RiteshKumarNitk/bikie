import type { RentalsBookingsPorts } from "../ports";

export function createWishlistApplication(ports: RentalsBookingsPorts) {
  return {
    getForUser(userId: string) {
      return ports.wishlist.findByUser(userId);
    },

    add(userId: string, bikeId: string) {
      return ports.wishlist.add(userId, bikeId);
    },

    remove(userId: string, bikeId: string) {
      return ports.wishlist.remove(userId, bikeId);
    },
  };
}

export type WishlistApplication = ReturnType<typeof createWishlistApplication>;
