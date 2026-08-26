import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  tripRepository: {},
  announcementRepository: {},
  messageRepository: {},
}));

import {
  computeApprovalRate,
  createRidesCommunityModule,
  evaluateDecideRequest,
  evaluateJoinRequest,
  evaluateLeaveRide,
  resolveRideRoomAccess,
  canManageRideRoom,
  redactTripDetailForViewer,
} from "./public";
import type { RidesCommunityPorts } from "./ports";
import type { TripDetailDTO } from "@bikie/types";

function emptyPorts(overrides: Partial<RidesCommunityPorts> = {}): RidesCommunityPorts {
  return {
    trips: {
      findTrips: vi.fn(async () => []),
      findBySlug: vi.fn(async () => null),
      findRequestedBy: vi.fn(async () => []),
      findOrganizedBy: vi.fn(async () => []),
      findJoinedBy: vi.fn(async () => []),
      findPendingRequestsForOrganizer: vi.fn(async () => []),
      getOrganizerDashboardMetrics: vi.fn(async () => ({ upcomingRides: 0, pendingRequests: 0 })),
      getRideStatsForUser: vi.fn(async () => ({
        ridesOrganized: 0,
        requestsSent: 0,
        requestsApproved: 0,
        ridesCancelled: 0,
      })),
      createTrip: vi.fn(),
      updateTrip: vi.fn(),
      findParticipant: vi.fn(async () => null),
      findParticipantById: vi.fn(async () => null),
      upsertJoinRequest: vi.fn(),
      findPendingRequestsForTrip: vi.fn(async () => []),
      decideParticipant: vi.fn(),
      cancelParticipant: vi.fn(),
      incrementSeatsLeft: vi.fn(),
      findConversationIdForTrip: vi.fn(async () => null),
      approveParticipantAtomically: vi.fn(),
      cancelTrip: vi.fn(async () => 1),
      findPendingRequesterIds: vi.fn(async () => []),
      getRoomInfo: vi.fn(async () => null),
      updateMeetingPoint: vi.fn(),
      updateEmergencyContacts: vi.fn(),
    },
    announcements: {
      findForTrip: vi.fn(async () => []),
      create: vi.fn(),
      findById: vi.fn(async () => null),
      remove: vi.fn(),
      findMediaForConversation: vi.fn(async () => []),
    },
    unread: { countUnread: vi.fn(async () => 0) },
    conversations: {
      getById: vi.fn(async () => null),
      getOtherParticipantIds: vi.fn(async () => []),
      setLocked: vi.fn(async () => undefined),
    },
    systemMessages: { create: vi.fn(async () => undefined) },
    notifications: {
      notify: vi.fn(async () => undefined),
      notifyMany: vi.fn(async () => undefined),
    },
    realtime: { publishToUsers: vi.fn(async () => undefined) },
    ...overrides,
  };
}

describe("participation domain", () => {
  it("blocks join for missing / closed / organizer / full / duplicate", () => {
    expect(evaluateJoinRequest({ trip: null, userId: "u1" })).toEqual({
      ok: false,
      reason: "TRIP_NOT_FOUND",
    });
    expect(
      evaluateJoinRequest({
        trip: { status: "COMPLETED", organizerId: "o1", seatsLeft: 2 },
        userId: "u1",
      }),
    ).toEqual({ ok: false, reason: "NOT_OPEN" });
    expect(
      evaluateJoinRequest({
        trip: { status: "UPCOMING", organizerId: "u1", seatsLeft: 2 },
        userId: "u1",
      }),
    ).toEqual({ ok: false, reason: "IS_ORGANIZER" });
    expect(
      evaluateJoinRequest({
        trip: { status: "UPCOMING", organizerId: "o1", seatsLeft: 0 },
        userId: "u1",
      }),
    ).toEqual({ ok: false, reason: "FULL" });
    expect(
      evaluateJoinRequest({
        trip: { status: "UPCOMING", organizerId: "o1", seatsLeft: 1 },
        userId: "u1",
        existingStatus: "PENDING",
      }),
    ).toEqual({ ok: false, reason: "ALREADY_REQUESTED" });
    expect(
      evaluateJoinRequest({
        trip: { status: "UPCOMING", organizerId: "o1", seatsLeft: 1 },
        userId: "u1",
      }),
    ).toEqual({ ok: true });
  });

  it("gates decide and leave", () => {
    expect(evaluateDecideRequest({ participant: null, organizerId: "o1" })).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
    expect(
      evaluateDecideRequest({
        participant: { status: "PENDING", organizerId: "other" },
        organizerId: "o1",
      }),
    ).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(
      evaluateDecideRequest({
        participant: { status: "APPROVED", organizerId: "o1" },
        organizerId: "o1",
      }),
    ).toEqual({ ok: false, reason: "ALREADY_DECIDED" });

    expect(evaluateLeaveRide({ tripExists: false })).toEqual({
      ok: false,
      reason: "TRIP_NOT_FOUND",
    });
    expect(evaluateLeaveRide({ tripExists: true, participantStatus: "APPROVED" })).toEqual({
      ok: true,
      wasApproved: true,
    });
  });

  it("computes approval rate", () => {
    expect(computeApprovalRate(0, 0)).toBeNull();
    expect(computeApprovalRate(4, 3)).toBe(75);
  });
});

describe("ride room access", () => {
  it("resolves admin / organizer / member / forbidden", () => {
    expect(
      resolveRideRoomAccess({
        trip: null,
        userId: "u1",
        userRole: "RENTER",
      }),
    ).toEqual({ ok: false, reason: "TRIP_NOT_FOUND" });

    expect(
      resolveRideRoomAccess({
        trip: { id: "t1", organizerId: "o1" },
        userId: "u1",
        userRole: "ADMIN",
      }).ok,
    ).toBe(true);

    expect(
      resolveRideRoomAccess({
        trip: { id: "t1", organizerId: "u1" },
        userId: "u1",
        userRole: "RENTER",
      }),
    ).toMatchObject({ ok: true, role: "ORGANIZER" });

    expect(
      resolveRideRoomAccess({
        trip: { id: "t1", organizerId: "o1" },
        userId: "u1",
        userRole: "RENTER",
        participantStatus: "APPROVED",
      }),
    ).toMatchObject({ ok: true, role: "MEMBER" });

    expect(canManageRideRoom("MEMBER")).toBe(false);
    expect(canManageRideRoom("ORGANIZER")).toBe(true);
  });
});

describe("approve application", () => {
  it("uses atomic approve for APPROVED and notifies after", async () => {
    const approveParticipantAtomically = vi.fn(async () => ({
      ok: true as const,
      conversationId: "c1",
      tripId: "t1",
      tripSlug: "goa-ride",
      tripTitle: "Goa Ride",
      organizerName: "Org",
      userId: "u2",
      userName: "Rider",
    }));
    const systemCreate = vi.fn(async () => undefined);
    const notify = vi.fn(async () => undefined);

    const module = createRidesCommunityModule(
      emptyPorts({
        trips: {
          ...emptyPorts().trips,
          approveParticipantAtomically,
        },
        systemMessages: { create: systemCreate },
        notifications: { notify, notifyMany: vi.fn(async () => undefined) },
      }),
    );

    await expect(module.trips.decideRequest("p1", "o1", "APPROVED")).resolves.toEqual({ ok: true });
    expect(approveParticipantAtomically).toHaveBeenCalledWith("p1", "o1");
    expect(systemCreate).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      "u2",
      "RIDE_REQUEST_APPROVED",
      "Ride request approved",
      expect.stringContaining("Goa Ride"),
      "Trip",
      "goa-ride",
    );
  });

  it("propagates NO_SEATS from atomic approve", async () => {
    const module = createRidesCommunityModule(
      emptyPorts({
        trips: {
          ...emptyPorts().trips,
          approveParticipantAtomically: vi.fn(async () => ({
            ok: false as const,
            reason: "NO_SEATS" as const,
          })),
        },
      }),
    );

    await expect(module.trips.decideRequest("p1", "o1", "APPROVED")).resolves.toEqual({
      ok: false,
      reason: "NO_SEATS",
    });
  });
});

// Security fix — `GET /api/trips/[slug]` is deliberately public (discovery), but the exact
// meeting point and member roster are not discovery information; see domain/visibility.ts.
describe("trip detail visibility (redacts meeting point + roster for non-participants)", () => {
  function sampleTripDetail(): TripDetailDTO {
    return {
      id: "trip-1",
      slug: "goa-ride",
      title: "Goa Ride",
      imageUrl: "img.jpg",
      type: "TOURING",
      difficulty: "EASY",
      price: 0,
      seatsTotal: 5,
      seatsLeft: 3,
      startDate: "2026-09-01T00:00:00.000Z",
      endDate: "2026-09-03T00:00:00.000Z",
      status: "UPCOMING",
      destination: null,
      destinationName: "Goa",
      description: "A ride to Goa",
      gallery: [],
      meetingPoint: "Cafe Coffee Day, MG Road",
      meetingLat: 12.97,
      meetingLng: 77.59,
      organizer: { id: "organizer-1", name: "Org", image: null },
      members: [{ id: "member-1", name: "Member One", image: null }],
    };
  }

  it("redacts meeting point/coordinates and the member roster for a bystander", () => {
    const redacted = redactTripDetailForViewer(sampleTripDetail(), { userId: "bystander", isAdmin: false });
    expect(redacted).toMatchObject({ meetingPoint: null, meetingLat: null, meetingLng: null, members: undefined });
    // Discovery info stays visible.
    expect(redacted.title).toBe("Goa Ride");
    expect(redacted.organizer).toEqual({ id: "organizer-1", name: "Org", image: null });
  });

  it("redacts for an unauthenticated caller (userId: null)", () => {
    const redacted = redactTripDetailForViewer(sampleTripDetail(), { userId: null, isAdmin: false });
    expect(redacted.meetingLat).toBeNull();
    expect(redacted.members).toBeUndefined();
  });

  it("does not redact for the organizer", () => {
    const redacted = redactTripDetailForViewer(sampleTripDetail(), { userId: "organizer-1", isAdmin: false });
    expect(redacted.meetingLat).toBe(12.97);
    expect(redacted.members).toEqual([{ id: "member-1", name: "Member One", image: null }]);
  });

  it("does not redact for an approved member", () => {
    const redacted = redactTripDetailForViewer(sampleTripDetail(), { userId: "member-1", isAdmin: false });
    expect(redacted.meetingLat).toBe(12.97);
  });

  it("does not redact for an admin", () => {
    const redacted = redactTripDetailForViewer(sampleTripDetail(), { userId: "someone-else", isAdmin: true });
    expect(redacted.meetingLat).toBe(12.97);
  });

  it("TripApplication.getBySlug applies the same redaction, defaulting to an unauthenticated viewer", async () => {
    const findBySlug = vi.fn(async () => sampleTripDetail());
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug } }));

    const asBystander = await module.trips.getBySlug("goa-ride");
    expect(asBystander).toMatchObject({ meetingLat: null, members: undefined });

    const asOrganizer = await module.trips.getBySlug("goa-ride", { userId: "organizer-1", isAdmin: false });
    expect(asOrganizer).toMatchObject({ meetingLat: 12.97 });
  });

  it("returns null (not an error) when the trip doesn't exist, regardless of viewer", async () => {
    const module = createRidesCommunityModule(emptyPorts());
    await expect(module.trips.getBySlug("missing")).resolves.toBeNull();
  });
});

// P1 Community — ride cancellation lifecycle.
describe("cancelTrip", () => {
  function sampleUpcomingTrip(): TripDetailDTO {
    return {
      id: "trip-1",
      slug: "goa-ride",
      title: "Goa Ride",
      imageUrl: "img.jpg",
      type: "TOURING",
      difficulty: "EASY",
      price: 0,
      seatsTotal: 5,
      seatsLeft: 3,
      startDate: "2026-09-01T00:00:00.000Z",
      endDate: "2026-09-03T00:00:00.000Z",
      status: "UPCOMING",
      destination: null,
      destinationName: "Goa",
      description: "A ride to Goa",
      gallery: [],
      meetingPoint: "Cafe Coffee Day, MG Road",
      meetingLat: 12.97,
      meetingLng: 77.59,
      organizer: { id: "organizer-1", name: "Org", image: null },
      members: [
        { id: "member-1", name: "Member One", image: null },
        { id: "member-2", name: "Member Two", image: null },
      ],
    };
  }

  it("returns TRIP_NOT_FOUND when the trip doesn't exist", async () => {
    const module = createRidesCommunityModule(emptyPorts());
    await expect(module.trips.cancelTrip("missing", "organizer-1")).resolves.toEqual({
      ok: false,
      reason: "TRIP_NOT_FOUND",
    });
  });

  it("returns FORBIDDEN for a non-organizer, non-admin caller — and never touches the trip", async () => {
    const cancelTrip = vi.fn(async () => 1);
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug, cancelTrip } }));

    await expect(module.trips.cancelTrip("goa-ride", "someone-else")).resolves.toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(cancelTrip).not.toHaveBeenCalled();
  });

  it("allows an admin to cancel even though they aren't the organizer", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const cancelTrip = vi.fn(async () => 1);
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug, cancelTrip } }));

    await expect(module.trips.cancelTrip("goa-ride", "admin-1", true)).resolves.toEqual({ ok: true });
    expect(cancelTrip).toHaveBeenCalledWith("trip-1");
  });

  it("returns NOT_UPCOMING (idempotency guard) when the conditional update transitions 0 rows", async () => {
    // Simulates a double-submit, or a cancel racing a completion — cancelTrip's own
    // `WHERE status: "UPCOMING"` guard already handled the race; this is just the 0-rows signal.
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const cancelTrip = vi.fn(async () => 0);
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug, cancelTrip } }));

    await expect(module.trips.cancelTrip("goa-ride", "organizer-1")).resolves.toEqual({
      ok: false,
      reason: "NOT_UPCOMING",
    });
  });

  it("on success: locks the Ride Room, posts a system message, and notifies every approved member and pending requester (but not the actor)", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const cancelTrip = vi.fn(async () => 1);
    const findConversationIdForTrip = vi.fn(async () => "conv-1");
    const findPendingRequesterIds = vi.fn(async () => ["pending-1", "organizer-1"]); // dedupe check below
    const systemCreate = vi.fn(async () => undefined);
    const setLocked = vi.fn(async () => undefined);
    const notify = vi.fn(
      async (_userId: string, _type: string, _title: string, _body: string, _entity?: string, _entityId?: string) =>
        undefined,
    );

    const module = createRidesCommunityModule(
      emptyPorts({
        trips: {
          ...emptyPorts().trips,
          findBySlug,
          cancelTrip,
          findConversationIdForTrip,
          findPendingRequesterIds,
        },
        systemMessages: { create: systemCreate },
        conversations: { getById: vi.fn(async () => null), getOtherParticipantIds: vi.fn(async () => []), setLocked },
        notifications: { notify, notifyMany: vi.fn(async () => undefined) },
      }),
    );

    await expect(module.trips.cancelTrip("goa-ride", "organizer-1", false, "Weather")).resolves.toEqual({ ok: true });

    expect(cancelTrip).toHaveBeenCalledWith("trip-1");
    expect(systemCreate).toHaveBeenCalledWith(
      "conv-1",
      expect.stringContaining("Weather"),
      expect.objectContaining({ event: "TRIP_CANCELLED" }),
    );
    expect(setLocked).toHaveBeenCalledWith("conv-1", "organizer-1", true);

    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toContain("member-1");
    expect(notifiedIds).toContain("member-2");
    expect(notifiedIds).toContain("pending-1");
    // The organizer (the actor) is deduped out even though findPendingRequesterIds included them.
    expect(notifiedIds).not.toContain("organizer-1");
    expect(notify).toHaveBeenCalledWith(
      "member-1",
      "TRIP_CANCELLED",
      "Ride cancelled",
      expect.stringContaining("Goa Ride"),
      "Trip",
      "goa-ride",
    );
  });

  it("still cancels the trip even when there's no conversation yet (no members ever approved)", async () => {
    const findBySlug = vi.fn(async () => ({ ...sampleUpcomingTrip(), members: [] }));
    const cancelTrip = vi.fn(async () => 1);
    const findConversationIdForTrip = vi.fn(async () => null);
    const systemCreate = vi.fn(async () => undefined);
    const setLocked = vi.fn(async () => undefined);

    const module = createRidesCommunityModule(
      emptyPorts({
        trips: { ...emptyPorts().trips, findBySlug, cancelTrip, findConversationIdForTrip },
        systemMessages: { create: systemCreate },
        conversations: { getById: vi.fn(async () => null), getOtherParticipantIds: vi.fn(async () => []), setLocked },
      }),
    );

    await expect(module.trips.cancelTrip("goa-ride", "organizer-1")).resolves.toEqual({ ok: true });
    expect(systemCreate).not.toHaveBeenCalled();
    expect(setLocked).not.toHaveBeenCalled();
  });
});

// P2 — reschedule validation + notification, and the seats-below-approved guard.
describe("update (reschedule + validation)", () => {
  function sampleUpcomingTrip(): TripDetailDTO {
    return {
      id: "trip-1",
      slug: "goa-ride",
      title: "Goa Ride",
      imageUrl: "img.jpg",
      type: "TOURING",
      difficulty: "EASY",
      price: 0,
      seatsTotal: 5,
      seatsLeft: 3,
      startDate: "2026-09-01T00:00:00.000Z",
      endDate: "2026-09-03T00:00:00.000Z",
      status: "UPCOMING",
      destination: null,
      destinationName: "Goa",
      description: "A ride to Goa",
      gallery: [],
      meetingPoint: "Cafe Coffee Day, MG Road",
      meetingLat: 12.97,
      meetingLng: 77.59,
      organizer: { id: "organizer-1", name: "Org", image: null },
      members: [
        { id: "member-1", name: "Member One", image: null },
        { id: "member-2", name: "Member Two", image: null },
      ],
    };
  }

  const summaryFromTrip = (t: TripDetailDTO) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    imageUrl: t.imageUrl,
    type: t.type,
    difficulty: t.difficulty,
    price: t.price,
    seatsTotal: t.seatsTotal,
    seatsLeft: t.seatsLeft,
    startDate: t.startDate,
    endDate: t.endDate,
    status: t.status,
    destination: t.destination,
    destinationName: t.destinationName,
  });

  it("returns NOT_FOUND when the trip doesn't exist", async () => {
    const module = createRidesCommunityModule(emptyPorts());
    await expect(module.trips.update("missing", "organizer-1", {})).resolves.toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });

  it("returns FORBIDDEN for a non-organizer", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug } }));
    await expect(module.trips.update("goa-ride", "someone-else", {})).resolves.toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });

  it("returns INVALID_DATES when the new endDate is before the trip's existing startDate (partial update, only endDate sent)", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const updateTrip = vi.fn();
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug, updateTrip } }));

    await expect(
      module.trips.update("goa-ride", "organizer-1", { endDate: "2026-08-01T00:00:00.000Z" }),
    ).resolves.toEqual({ ok: false, reason: "INVALID_DATES" });
    expect(updateTrip).not.toHaveBeenCalled();
  });

  it("returns SEATS_BELOW_APPROVED rather than silently leaving seatsLeft inconsistent", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip()); // 2 approved members
    const updateTrip = vi.fn();
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug, updateTrip } }));

    await expect(module.trips.update("goa-ride", "organizer-1", { seatsTotal: 1 })).resolves.toEqual({
      ok: false,
      reason: "SEATS_BELOW_APPROVED",
    });
    expect(updateTrip).not.toHaveBeenCalled();
  });

  it("recomputes seatsLeft alongside seatsTotal instead of leaving it stale", async () => {
    const trip = sampleUpcomingTrip();
    const findBySlug = vi.fn(async () => trip);
    const updateTrip = vi.fn(async () => summaryFromTrip({ ...trip, seatsTotal: 8, seatsLeft: 6 }));
    const module = createRidesCommunityModule(emptyPorts({ trips: { ...emptyPorts().trips, findBySlug, updateTrip } }));

    await expect(module.trips.update("goa-ride", "organizer-1", { seatsTotal: 8 })).resolves.toMatchObject({ ok: true });
    // 8 total - 2 already-approved members = 6 left, not the untouched original seatsLeft (3).
    expect(updateTrip).toHaveBeenCalledWith("goa-ride", expect.objectContaining({ seatsTotal: 8, seatsLeft: 6 }));
  });

  it("a non-date field-only edit posts the generic system message and sends no TRIP_RESCHEDULED notification", async () => {
    const trip = sampleUpcomingTrip();
    const findBySlug = vi.fn(async () => trip);
    const updateTrip = vi.fn(async () => summaryFromTrip({ ...trip, title: "Goa Ride v2" }));
    const findConversationIdForTrip = vi.fn(async () => "conv-1");
    const systemCreate = vi.fn(async () => undefined);
    const notify = vi.fn(async () => undefined);
    const module = createRidesCommunityModule(
      emptyPorts({
        trips: { ...emptyPorts().trips, findBySlug, updateTrip, findConversationIdForTrip },
        systemMessages: { create: systemCreate },
        notifications: { notify, notifyMany: vi.fn(async () => undefined) },
      }),
    );

    await expect(module.trips.update("goa-ride", "organizer-1", { title: "Goa Ride v2" })).resolves.toMatchObject({
      ok: true,
    });
    expect(systemCreate).toHaveBeenCalledWith(
      "conv-1",
      "The ride details were updated by the organizer.",
      expect.objectContaining({ rescheduled: false }),
    );
    expect(notify).not.toHaveBeenCalled();
  });

  it("a reschedule notifies every approved member (not the organizer) and posts a dated system message", async () => {
    const trip = sampleUpcomingTrip();
    const findBySlug = vi.fn(async () => trip);
    const newStart = "2026-09-10T00:00:00.000Z";
    const newEnd = "2026-09-12T00:00:00.000Z";
    const updateTrip = vi.fn(async () => summaryFromTrip({ ...trip, startDate: newStart, endDate: newEnd }));
    const findConversationIdForTrip = vi.fn(async () => "conv-1");
    const systemCreate = vi.fn(async () => undefined);
    const notify = vi.fn(
      async (_userId: string, _type: string, _title: string, _body: string, _entity?: string, _entityId?: string) =>
        undefined,
    );
    const module = createRidesCommunityModule(
      emptyPorts({
        trips: { ...emptyPorts().trips, findBySlug, updateTrip, findConversationIdForTrip },
        systemMessages: { create: systemCreate },
        notifications: { notify, notifyMany: vi.fn(async () => undefined) },
      }),
    );

    await expect(module.trips.update("goa-ride", "organizer-1", { startDate: newStart, endDate: newEnd })).resolves.toMatchObject({
      ok: true,
    });

    expect(systemCreate).toHaveBeenCalledWith(
      "conv-1",
      expect.stringContaining("rescheduled"),
      expect.objectContaining({ rescheduled: true }),
    );
    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toContain("member-1");
    expect(notifiedIds).toContain("member-2");
    expect(notifiedIds).not.toContain("organizer-1");
    expect(notify).toHaveBeenCalledWith(
      "member-1",
      "TRIP_RESCHEDULED",
      "Ride rescheduled",
      expect.stringContaining("Goa Ride"),
      "Trip",
      "goa-ride",
    );
  });
});

// P2 — leaving a ride previously only posted a chat message; the organizer could easily miss it.
describe("leaveRide notifies the organizer", () => {
  function sampleUpcomingTrip(): TripDetailDTO {
    return {
      id: "trip-1",
      slug: "goa-ride",
      title: "Goa Ride",
      imageUrl: "img.jpg",
      type: "TOURING",
      difficulty: "EASY",
      price: 0,
      seatsTotal: 5,
      seatsLeft: 3,
      startDate: "2026-09-01T00:00:00.000Z",
      endDate: "2026-09-03T00:00:00.000Z",
      status: "UPCOMING",
      destination: null,
      destinationName: "Goa",
      description: "A ride to Goa",
      gallery: [],
      meetingPoint: null,
      meetingLat: null,
      meetingLng: null,
      organizer: { id: "organizer-1", name: "Org", image: null },
      members: [{ id: "member-1", name: "Member One", image: null }],
    };
  }

  it("notifies the organizer (SYSTEM type) when an APPROVED member leaves", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const findParticipant = vi.fn(async () => ({ id: "participant-1", status: "APPROVED", message: null }));
    const cancelParticipant = vi.fn(async () => undefined);
    const incrementSeatsLeft = vi.fn(async () => undefined);
    const notify = vi.fn(async () => undefined);

    const module = createRidesCommunityModule(
      emptyPorts({
        trips: { ...emptyPorts().trips, findBySlug, findParticipant, cancelParticipant, incrementSeatsLeft },
        notifications: { notify, notifyMany: vi.fn(async () => undefined) },
      }),
    );

    await expect(module.trips.leaveRide("goa-ride", "member-1", "Member One")).resolves.toEqual({ ok: true });

    expect(incrementSeatsLeft).toHaveBeenCalledWith("trip-1");
    expect(notify).toHaveBeenCalledWith(
      "organizer-1",
      "SYSTEM",
      "A rider left your ride",
      expect.stringContaining("Member One"),
      "Trip",
      "goa-ride",
    );
  });

  it("does not notify the organizer when withdrawing a still-PENDING request (never occupied a seat)", async () => {
    const findBySlug = vi.fn(async () => sampleUpcomingTrip());
    const findParticipant = vi.fn(async () => ({ id: "participant-1", status: "PENDING", message: null }));
    const notify = vi.fn(async () => undefined);
    const incrementSeatsLeft = vi.fn(async () => undefined);

    const module = createRidesCommunityModule(
      emptyPorts({
        trips: { ...emptyPorts().trips, findBySlug, findParticipant, incrementSeatsLeft },
        notifications: { notify, notifyMany: vi.fn(async () => undefined) },
      }),
    );

    await expect(module.trips.leaveRide("goa-ride", "member-1", "Member One")).resolves.toEqual({ ok: true });
    expect(incrementSeatsLeft).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
