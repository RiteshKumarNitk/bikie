import { wishlistRepository } from "@bikie/database";
import type { WishlistItemDTO } from "@bikie/types";

export const WishlistService = {
  async getForUser(userId: string): Promise<WishlistItemDTO[]> {
    return wishlistRepository.findWishlistByUser(userId);
  },

  async add(userId: string, bikeId: string): Promise<void> {
    await wishlistRepository.addToWishlist(userId, bikeId);
  },

  async remove(userId: string, bikeId: string): Promise<void> {
    await wishlistRepository.removeFromWishlist(userId, bikeId);
  },
};
