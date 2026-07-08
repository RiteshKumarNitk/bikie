import { wishlistRepository } from "@bikie/database";
import type { WishlistItemDTO } from "@bikie/types";

export const WishlistService = {
  async getForUser(userId: string): Promise<WishlistItemDTO[]> {
    return wishlistRepository.findWishlistByUser(userId);
  },
};
