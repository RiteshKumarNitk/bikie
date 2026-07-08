import { z } from "zod";

export const featuredBikesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const popularDestinationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export const featuredTestimonialsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});
