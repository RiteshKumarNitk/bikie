export type RideRoomRole = "ORGANIZER" | "MEMBER" | "ADMIN";

export type RideRoomAccessDecision =
  | { ok: true; role: RideRoomRole; tripId: string; organizerId: string }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "FORBIDDEN" };

export function resolveRideRoomAccess(input: {
  trip: { id: string; organizerId: string } | null;
  userId: string;
  userRole: string;
  participantStatus?: string | null;
}): RideRoomAccessDecision {
  if (!input.trip) return { ok: false, reason: "TRIP_NOT_FOUND" };
  if (input.userRole === "ADMIN") {
    return {
      ok: true,
      role: "ADMIN",
      tripId: input.trip.id,
      organizerId: input.trip.organizerId,
    };
  }
  if (input.trip.organizerId === input.userId) {
    return {
      ok: true,
      role: "ORGANIZER",
      tripId: input.trip.id,
      organizerId: input.trip.organizerId,
    };
  }
  if (input.participantStatus === "APPROVED") {
    return {
      ok: true,
      role: "MEMBER",
      tripId: input.trip.id,
      organizerId: input.trip.organizerId,
    };
  }
  return { ok: false, reason: "FORBIDDEN" };
}

export function canManageRideRoom(role: RideRoomRole): boolean {
  return role === "ORGANIZER" || role === "ADMIN";
}
