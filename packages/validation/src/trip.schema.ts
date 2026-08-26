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

/** Only catches the case both dates are present in the same payload — always true for create,
 * only sometimes true for a partial update (e.g. rescheduling just `endDate` while `startDate`
 * stays whatever it already is in the DB). The application layer's `update()` re-checks against
 * the trip's actual current dates for the partial case, so order is enforced either way. */
function refineDateOrder(data: { startDate?: string; endDate?: string }, ctx: z.RefinementCtx) {
  if (!data.startDate || !data.endDate) return;
  if (new Date(data.endDate).getTime() <= new Date(data.startDate).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "endDate must be after startDate" });
  }
}

export const createTripSchema = z.object(tripFields).superRefine((data, ctx) => {
  refineMeetingPin(data, ctx);
  refineDateOrder(data, ctx);
});
export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = z.object(tripFields).partial().superRefine((data, ctx) => {
  refineMeetingPin(data, ctx);
  refineDateOrder(data, ctx);
});
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export type JoinRequestInput = z.infer<typeof joinRequestSchema>;

export const cancelTripSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type CancelTripInput = z.infer<typeof cancelTripSchema>;
