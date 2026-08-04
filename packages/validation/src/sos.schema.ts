import { z } from "zod";

export const sosAlertTypeSchema = z.enum([
  "ACCIDENT",
  "BIKE_BREAKDOWN",
  "FUEL_EMPTY",
  "MEDICAL",
  "LOST",
  "OTHER",
  "LIFE_THREATENING",
  "FLAT_TYRE",
  "BATTERY_ISSUE",
]);

export const sosAlertCreateSchema = z.object({
  type: sosAlertTypeSchema,
  description: z.string().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  city: z.string().min(1).max(100),
});

export type SOSAlertCreateSchemaInput = z.infer<typeof sosAlertCreateSchema>;

export const sosOfferCreateSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  message: z.string().max(300).optional(),
});

export const sosSessionStatusSchema = z.object({
  status: z.enum(["HELPER_ARRIVED", "ASSISTANCE_IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  cancelReason: z.string().max(300).optional(),
});

export const sosRatingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
