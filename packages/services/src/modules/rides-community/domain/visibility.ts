import type { TripDetailDTO } from "@bikie/types";

export type TripViewer = { userId: string | null; isAdmin: boolean };

/**
 * `GET /api/trips/[slug]` is deliberately public/unauthenticated (discovery — a visitor should
 * be able to browse a ride before ever signing up), but the exact meeting point and the approved
 * member roster are not discovery information — they're only meaningful, and only meant to be
 * seen, once you're actually going. Redacted to `null`/absent for anyone who isn't the organizer,
 * an approved member, or an admin, mirroring the safety-location module's `redactAlertForViewer`
 * (ADR-045) rather than inventing a second privacy rule.
 */
export function redactTripDetailForViewer(trip: TripDetailDTO, viewer: TripViewer): TripDetailDTO {
  const isOrganizer = viewer.userId != null && trip.organizer.id === viewer.userId;
  const isApprovedMember = viewer.userId != null && (trip.members ?? []).some((m) => m.id === viewer.userId);
  if (viewer.isAdmin || isOrganizer || isApprovedMember) return trip;

  return {
    ...trip,
    meetingPoint: null,
    meetingLat: null,
    meetingLng: null,
    members: undefined,
  };
}
