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
  // Trimmed here, not just client-side, so a stored city with stray leading/trailing whitespace
  // can never desync from the (also-trimmed) case-insensitive match `getActiveAlerts` does when
  // another rider browses by city — see sos.repository.ts.
  city: z.string().min(1).max(100).transform((v) => v.trim()),
});

export type SOSAlertCreateSchemaInput = z.infer<typeof sosAlertCreateSchema>;

/** `GET /api/sos/alerts` query params (ADR-042) — a GPS radius around the viewer, replacing the
 * old free-text `city` filter. Non-admins must supply both; the route enforces that (ADMIN sees
 * every active alert network-wide, unfiltered). */
export const sosActiveAlertsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export type SosActiveAlertsQueryInput = z.infer<typeof sosActiveAlertsQuerySchema>;

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

/** ADR-045 — declining without ever offering; body is optional (an empty POST is valid). */
export const sosDeclineSchema = z.object({
  message: z.string().max(500).optional(),
});

/** §28 — reporter/admin cancels an alert while it's being dispatched; reason is optional. */
export const sosAlertCancelSchema = z.object({
  reason: z.string().max(300).optional(),
});
