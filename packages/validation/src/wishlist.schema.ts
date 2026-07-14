import { z } from "zod";

export const wishlistBikeIdSchema = z.object({
  bikeId: z.string().min(1),
});

export type WishlistBikeIdInput = z.infer<typeof wishlistBikeIdSchema>;
