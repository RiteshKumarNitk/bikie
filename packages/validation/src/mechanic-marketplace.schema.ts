import { z } from "zod";

export const createMechanicListingSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  category: z.string().min(1).max(60),
  price: z.number().positive(),
  imageUrls: z.array(z.string().url()).max(10).default([]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  serviceRadiusKm: z.number().int().positive().max(100).optional(),
});
export type CreateMechanicListingInput = z.infer<typeof createMechanicListingSchema>;

export const updateMechanicListingSchema = createMechanicListingSchema.partial();
export type UpdateMechanicListingInput = z.infer<typeof updateMechanicListingSchema>;

export const submitMechanicRequestSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type SubmitMechanicRequestInput = z.infer<typeof submitMechanicRequestSchema>;

export const transitionMechanicRequestSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});
export type TransitionMechanicRequestInput = z.infer<typeof transitionMechanicRequestSchema>;
