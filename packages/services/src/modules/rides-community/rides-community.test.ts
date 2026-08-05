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
} from "./public";
import type { RidesCommunityPorts } from "./ports";

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
