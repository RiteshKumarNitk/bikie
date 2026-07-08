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

export const bikeSearchQuerySchema = z.object({
  location: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  brand: z.string().trim().min(1).optional(),
  instantBooking: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["price_asc", "price_desc", "rating"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const tripsQuerySchema = z.object({
  tab: z.enum(["upcoming", "weekend", "adventure", "road-trip", "international", "guided-tour", "completed"]).optional(),
});
