import { tripRepository } from "@bikie/database";

export type RideRoomRole = "ORGANIZER" | "MEMBER" | "ADMIN";

export type RideRoomAccess =
  | { ok: true; role: RideRoomRole; tripId: string; organizerId: string }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "FORBIDDEN" };

export async function assertRideRoomAccess(
  slug: string,
  userId: string,
  userRole: string,
): Promise<RideRoomAccess> {
  const trip = await tripRepository.findTripBySlug(slug);
  if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };

  if (userRole === "ADMIN") {
    return { ok: true, role: "ADMIN", tripId: trip.id, organizerId: trip.organizer.id };
  }
  if (trip.organizer.id === userId) {
    return { ok: true, role: "ORGANIZER", tripId: trip.id, organizerId: trip.organizer.id };
  }

  const participant = await tripRepository.findParticipant(trip.id, userId);
  if (participant?.status === "APPROVED") {
    return { ok: true, role: "MEMBER", tripId: trip.id, organizerId: trip.organizer.id };
  }

  return { ok: false, reason: "FORBIDDEN" };
}

export function canManageRideRoom(role: RideRoomRole): boolean {
  return role === "ORGANIZER" || role === "ADMIN";
}
