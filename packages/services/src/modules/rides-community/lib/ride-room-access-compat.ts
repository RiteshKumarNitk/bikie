import { tripRepository } from "@bikie/database";
import {
  canManageRideRoom,
  resolveRideRoomAccess,
  type RideRoomAccessDecision,
  type RideRoomRole,
} from "../domain/room-access";

export type { RideRoomRole };
export type RideRoomAccess = RideRoomAccessDecision;

export { canManageRideRoom };

/** Async wrapper used by older callers — resolves trip + participant then applies domain policy. */
export async function assertRideRoomAccess(
  slug: string,
  userId: string,
  userRole: string,
): Promise<RideRoomAccess> {
  const trip = await tripRepository.findTripBySlug(slug);
  if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };

  const participant =
    trip.organizer.id !== userId && userRole !== "ADMIN"
      ? await tripRepository.findParticipant(trip.id, userId)
      : null;

  return resolveRideRoomAccess({
    trip: { id: trip.id, organizerId: trip.organizer.id },
    userId,
    userRole,
    participantStatus: participant?.status,
  });
}
