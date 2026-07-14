import { z } from "zod";

export const sosAlertCreateSchema = z.object({
  type: z.enum(["ACCIDENT", "BIKE_BREAKDOWN", "FUEL_EMPTY", "MEDICAL", "LOST", "OTHER"]),
  description: z.string().max(1000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  city: z.string().min(1).max(100),
});

export type SOSAlertCreateSchemaInput = z.infer<typeof sosAlertCreateSchema>;
