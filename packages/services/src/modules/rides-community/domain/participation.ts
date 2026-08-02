export type JoinRequestDenial =
  | "TRIP_NOT_FOUND"
  | "NOT_OPEN"
  | "IS_ORGANIZER"
  | "FULL"
  | "ALREADY_REQUESTED";

export type DecideDenial = "NOT_FOUND" | "FORBIDDEN" | "ALREADY_DECIDED" | "NO_SEATS";

export type LeaveDenial = "TRIP_NOT_FOUND" | "NOT_A_PARTICIPANT";

/** Join is only open on UPCOMING rides with seats, and never for the organizer. */
export function evaluateJoinRequest(input: {
  trip: { status: string; organizerId: string; seatsLeft: number } | null;
  userId: string;
  existingStatus?: string | null;
}): { ok: true } | { ok: false; reason: JoinRequestDenial } {
  if (!input.trip) return { ok: false, reason: "TRIP_NOT_FOUND" };
  if (input.trip.status !== "UPCOMING") return { ok: false, reason: "NOT_OPEN" };
  if (input.trip.organizerId === input.userId) return { ok: false, reason: "IS_ORGANIZER" };
  if (input.trip.seatsLeft <= 0) return { ok: false, reason: "FULL" };
  if (input.existingStatus === "PENDING" || input.existingStatus === "APPROVED") {
    return { ok: false, reason: "ALREADY_REQUESTED" };
  }
  return { ok: true };
}

export function evaluateDecideRequest(input: {
  participant: { status: string; organizerId: string } | null;
  organizerId: string;
}): { ok: true } | { ok: false; reason: DecideDenial } {
  if (!input.participant) return { ok: false, reason: "NOT_FOUND" };
  if (input.participant.organizerId !== input.organizerId) return { ok: false, reason: "FORBIDDEN" };
  if (input.participant.status !== "PENDING") return { ok: false, reason: "ALREADY_DECIDED" };
  return { ok: true };
}

export function evaluateLeaveRide(input: {
  tripExists: boolean;
  participantStatus?: string | null;
}): { ok: true; wasApproved: boolean } | { ok: false; reason: LeaveDenial } {
  if (!input.tripExists) return { ok: false, reason: "TRIP_NOT_FOUND" };
  if (input.participantStatus !== "PENDING" && input.participantStatus !== "APPROVED") {
    return { ok: false, reason: "NOT_A_PARTICIPANT" };
  }
  return { ok: true, wasApproved: input.participantStatus === "APPROVED" };
}

export function computeApprovalRate(requestsSent: number, requestsApproved: number): number | null {
  return requestsSent > 0 ? Math.round((requestsApproved / requestsSent) * 100) : null;
}
