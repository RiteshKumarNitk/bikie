import { z } from "zod";

// --- Bikes ---

export const createBikeSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  brand: z.string().min(1).max(100),
  categoryId: z.string().min(1),
  city: z.string().min(1).max(100),
  pricePerDay: z.coerce.number().min(0),
  imageUrl: z.string().url(),
  ownerId: z.string().min(1).optional(),
  description: z.string().max(3000).optional(),
});

export type CreateBikeInput = z.infer<typeof createBikeSchema>;

export const updateBikeSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).max(150).optional(),
  brand: z.string().min(1).max(100).optional(),
  categoryId: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  pricePerDay: z.coerce.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().max(3000).optional(),
});

export type UpdateBikeInput = z.infer<typeof updateBikeSchema>;

// --- Bookings ---

export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

// --- Users ---

export const updateUserRoleSchema = z.object({
  role: z.enum(["RENTER", "PARTNER", "ADMIN"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

// --- Testimonials ---

export const createTestimonialSchema = z.object({
  authorName: z.string().min(1).max(150),
  authorLocation: z.string().max(150).optional(),
  authorAvatarUrl: z.string().url().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().min(1).max(2000),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

export const updateTestimonialSchema = z.object({
  authorName: z.string().min(1).max(150).optional(),
  authorLocation: z.string().max(150).optional(),
  authorAvatarUrl: z.string().url().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  quote: z.string().min(1).max(2000).optional(),
  isFeatured: z.boolean().optional(),
});

export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
