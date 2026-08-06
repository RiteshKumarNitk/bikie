import { z } from "zod";

const tripFields = {
  title: z.string().min(3).max(120),
  description: z.string().min(1).max(3000),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional().transform(v => v === "" ? null : v),
  // Uploaded via the existing POST /api/upload (Cloudinary) — this just carries the resulting
  // URLs, same pattern as Bike.gallery.
  gallery: z.array(z.string().url()).max(8).optional(),
  type: z.enum(["WEEKEND", "ADVENTURE", "ROAD_TRIP", "INTERNATIONAL", "GUIDED_TOUR"]),
  difficulty: z.enum(["EASY", "MODERATE", "HARD"]).default("MODERATE"),
  price: z.coerce.number().min(0).default(0),
  seatsTotal: z.coerce.number().int().min(1).max(200),
  meetingPoint: z.string().max(200).optional(),
  // ADR-037: map pin for the meeting point, paired with meetingPoint's plain-text name — same
  // address-text-plus-pin shape as Partner shop location (ADR-036).
  meetingLat: z.coerce.number().min(-90).max(90).optional(),
  meetingLng: z.coerce.number().min(-180).max(180).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  // ADR-037: the organizer types this freely — no more picking from the curated Destination
  // catalog at ride-creation time. destinationId kept optional for backward compat only.
  destinationName: z.string().max(120).optional(),
  destinationId: z.string().min(1).optional(),
};

function refineMeetingPin(data: { meetingLat?: number; meetingLng?: number }, ctx: z.RefinementCtx) {
  if ((data.meetingLat === undefined) !== (data.meetingLng === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meetingLng"],
      message: "meetingLat and meetingLng must be provided together",
    });
  }
}

export const createTripSchema = z.object(tripFields).superRefine(refineMeetingPin);
export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object(tripFields).partial().superRefine(refineMeetingPin);
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export type JoinRequestInput = z.infer<typeof joinRequestSchema>;
