import { z } from "zod";

export const riderLocationUpdateSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const riderLocationConsentSchema = z.object({
  enabled: z.boolean(),
});

/** ADR-045 — independent of location-sharing consent: whether this rider should be paged as an
 * SOS dispatch candidate. */
export const riderSosOptOutSchema = z.object({
  enabled: z.boolean(),
});

export const nearbyRidersQuerySchema = z.object({
  radiusKm: z.coerce.number().min(0.1).max(50).default(5),
});

export type RiderLocationUpdateInput = z.infer<typeof riderLocationUpdateSchema>;
export type RiderLocationConsentInput = z.infer<typeof riderLocationConsentSchema>;
export type RiderSosOptOutInput = z.infer<typeof riderSosOptOutSchema>;
export type NearbyRidersQueryInput = z.infer<typeof nearbyRidersQuerySchema>;
