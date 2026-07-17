import { z } from "zod";

export const nearbyPlacesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  type: z.enum(["gas_station", "car_repair", "hospital"]),
});

export type NearbyPlacesQueryInput = z.infer<typeof nearbyPlacesQuerySchema>;
