import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
