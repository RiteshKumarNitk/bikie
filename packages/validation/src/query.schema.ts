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

// Query params commonly arrive as empty strings from unfilled HTML form fields
// (e.g. `?from=&to=`) rather than being omitted outright — treat those as absent.
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

export const tripsQuerySchema = z.object({
  tab: z.preprocess(
    emptyToUndefined,
    z.enum(["upcoming", "weekend", "adventure", "road-trip", "international", "guided-tour", "completed"]).optional(),
  ),
  destination: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  difficulty: z.preprocess(emptyToUndefined, z.enum(["EASY", "MODERATE", "HARD"]).optional()),
  from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
});
