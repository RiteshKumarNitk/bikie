import type { CreateTripInput, RideJoinRequestDTO, TripListFilters, TripSummaryDTO, UpdateTripInput } from "../ports";
import type { RidesCommunityPorts } from "../ports";
import { DEFAULT_TRIP_IMAGE } from "../domain/defaults";
import {
  computeApprovalRate,
  evaluateDecideRequest,
  evaluateJoinRequest,
  evaluateLeaveRide,
} from "../domain/participation";

export type RequestToJoinResult =
  | { ok: true }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "NOT_OPEN" | "IS_ORGANIZER" | "FULL" | "ALREADY_REQUESTED" };

export type DecideRequestResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_DECIDED" | "NO_SEATS" };

export type LeaveRideResult = { ok: true } | { ok: false; reason: "TRIP_NOT_FOUND" | "NOT_A_PARTICIPANT" };

export type GetRequestsResult =
  | { ok: true; requests: RideJoinRequestDTO[] }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "FORBIDDEN" };

export type GetGroupResult =
  | { ok: true; conversationId: string }
  | { ok: false; reason: "TRIP_NOT_FOUND" | "FORBIDDEN" | "NOT_STARTED" };

export function createTripApplication(ports: RidesCommunityPorts) {
  return {
    getByTab(tab?: string, filters?: TripListFilters) {
      return ports.trips.findTrips(tab, filters);
    },

    getBySlug(slug: string) {
      return ports.trips.findBySlug(slug);
    },

    getRequestedBy(userId: string) {
      return ports.trips.findRequestedBy(userId);
    },

    getAllPendingRequests(userId: string) {
      return ports.trips.findPendingRequestsForOrganizer(userId);
    },

    async getOverview(userId: string) {
      const metrics = await ports.trips.getOrganizerDashboardMetrics(userId);
      const unreadMessages = await ports.unread.countUnread(userId);

      const actionableItems = [];
      if (metrics.pendingRequests > 0) {
        actionableItems.push({
          id: "pending-requests",
          type: "PENDING_APPROVALS",
          title: `${metrics.pendingRequests} Riders waiting approval`,
          actionLabel: "Manage Requests",
          actionHref: "/dashboard/requests",
        });
      }

      if (unreadMessages > 0) {
        actionableItems.push({
          id: "unread-messages",
          type: "UNREAD_MESSAGES",
          title: `${unreadMessages} unread messages`,
          actionLabel: "Open Chat",
          actionHref: "/dashboard/messages",
        });
      }

      return {
        stats: {
          upcomingRides: metrics.upcomingRides,
          pendingRequests: metrics.pendingRequests,
          unreadMessages,
          ridesTomorrow: 0,
        },
        actionableItems,
      };
    },

    async getStats(userId: string) {
      const stats = await ports.trips.getRideStatsForUser(userId);
      return { ...stats, approvalRate: computeApprovalRate(stats.requestsSent, stats.requestsApproved) };
    },

    getOrganizedBy(userId: string) {
      return ports.trips.findOrganizedBy(userId);
    },

    getJoinedBy(userId: string) {
      return ports.trips.findJoinedBy(userId);
    },

    create(organizerId: string, input: CreateTripInput): Promise<TripSummaryDTO> {
      return ports.trips.createTrip({
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl ?? DEFAULT_TRIP_IMAGE,
        gallery: input.gallery,
        type: input.type,
        difficulty: input.difficulty,
        price: input.price,
        seatsTotal: input.seatsTotal,
        meetingPoint: input.meetingPoint,
        meetingLat: input.meetingLat,
        meetingLng: input.meetingLng,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        organizerId,
        destinationName: input.destinationName,
        destinationId: input.destinationId,
      });
    },

    async update(slug: string, userId: string, input: UpdateTripInput) {
      const trip = await ports.trips.findBySlug(slug);
      if (!trip) return { ok: false as const, reason: "NOT_FOUND" };
      if (trip.organizer.id !== userId) return { ok: false as const, reason: "FORBIDDEN" };

      const updated = await ports.trips.updateTrip(slug, {
        title: input.title,
        description: input.description,
        imageUrl: input.imageUrl === null ? "" : input.imageUrl !== undefined ? input.imageUrl : undefined,
        type: input.type as never,
        difficulty: input.difficulty as never,
        price: input.price,
        seatsTotal: input.seatsTotal,
        meetingPoint: input.meetingPoint,
        meetingLat: input.meetingLat,
        meetingLng: input.meetingLng,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        destinationName: input.destinationName,
        destinationId: input.destinationId,
      });

      const conversationId = await ports.trips.findConversationIdForTrip(trip.id);
      if (conversationId) {
        await ports.systemMessages.create(conversationId, `The ride details were updated by the organizer.`, {
          event: "TRIP_UPDATED",
        });
      }

      return { ok: true as const, trip: updated };
    },

    async requestToJoin(slug: string, userId: string, message?: string): Promise<RequestToJoinResult> {
      const trip = await ports.trips.findBySlug(slug);
      const existing = trip ? await ports.trips.findParticipant(trip.id, userId) : null;
      const decision = evaluateJoinRequest({
        trip: trip
          ? { status: trip.status, organizerId: trip.organizer.id, seatsLeft: trip.seatsLeft }
          : null,
        userId,
        existingStatus: existing?.status,
      });
      if (!decision.ok) return decision;

      await ports.trips.upsertJoinRequest(trip!.id, userId, message);
      await ports.notifications.notify(
        trip!.organizer.id,
        "RIDE_REQUEST_RECEIVED",
        "New ride request",
        `Someone requested to join "${trip!.title}".`,
        "Trip",
        slug,
      );
      return { ok: true };
    },

    async getMyRequestStatus(slug: string, userId: string) {
      const trip = await ports.trips.findBySlug(slug);
      if (!trip) return null;
      const participant = await ports.trips.findParticipant(trip.id, userId);
      return participant ? { status: participant.status, message: participant.message } : null;
    },

    async getPendingRequests(slug: string, organizerId: string): Promise<GetRequestsResult> {
      const trip = await ports.trips.findBySlug(slug);
      if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };
      if (trip.organizer.id !== organizerId) return { ok: false, reason: "FORBIDDEN" };
      const requests = await ports.trips.findPendingRequestsForTrip(trip.id);
      return {
        ok: true,
        requests: requests.map((r) => ({
          ...r,
          tripId: trip.id,
          tripSlug: trip.slug,
          tripTitle: trip.title,
        })),
      };
    },

    async decideRequest(
      participantId: string,
      organizerId: string,
      decision: "APPROVED" | "REJECTED",
    ): Promise<DecideRequestResult> {
      if (decision === "REJECTED") {
        const participant = await ports.trips.findParticipantById(participantId);
        const gate = evaluateDecideRequest({
          participant: participant
            ? { status: participant.status, organizerId: participant.trip.organizerId }
            : null,
          organizerId,
        });
        if (!gate.ok) return gate;

        await ports.trips.decideParticipant(participantId, "REJECTED");
        await ports.notifications.notify(
          participant!.userId,
          "RIDE_REQUEST_REJECTED",
          "Ride request declined",
          `Your request to join "${participant!.trip.title}" was declined.`,
          "Trip",
          participant!.trip.slug,
        );
        return { ok: true };
      }

      // APPROVED — seat + status + conversation in one DB transaction (P0).
      const approved = await ports.trips.approveParticipantAtomically(participantId, organizerId);
      if (!approved.ok) return approved;

      await ports.systemMessages.create(
        approved.conversationId,
        `${approved.organizerName} approved ${approved.userName}.`,
        { event: "USER_JOINED", userId: approved.userId, userName: approved.userName },
      );
      await ports.notifications.notify(
        approved.userId,
        "RIDE_REQUEST_APPROVED",
        "Ride request approved",
        `You're in! Your request to join "${approved.tripTitle}" was approved.`,
        "Trip",
        approved.tripSlug,
      );

      return { ok: true };
    },

    async leaveRide(slug: string, userId: string, userName: string): Promise<LeaveRideResult> {
      const trip = await ports.trips.findBySlug(slug);
      const participant = trip ? await ports.trips.findParticipant(trip.id, userId) : null;
      const decision = evaluateLeaveRide({
        tripExists: Boolean(trip),
        participantStatus: participant?.status,
      });
      if (!decision.ok) return decision;

      await ports.trips.cancelParticipant(participant!.id);
      if (decision.wasApproved) {
        await ports.trips.incrementSeatsLeft(trip!.id);
        const conversationId = await ports.trips.findConversationIdForTrip(trip!.id);
        if (conversationId) {
          await ports.systemMessages.create(conversationId, `${userName} left the ride.`, {
            event: "USER_LEFT",
            userId,
            userName,
          });
        }
      }

      return { ok: true };
    },

    async getGroup(slug: string, userId: string): Promise<GetGroupResult> {
      const trip = await ports.trips.findBySlug(slug);
      if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };

      const isOrganizer = trip.organizer.id === userId;
      const participant = isOrganizer ? null : await ports.trips.findParticipant(trip.id, userId);
      const isApprovedMember = participant?.status === "APPROVED";
      if (!isOrganizer && !isApprovedMember) return { ok: false, reason: "FORBIDDEN" };

      const conversationId = await ports.trips.findConversationIdForTrip(trip.id);
      if (!conversationId) return { ok: false, reason: "NOT_STARTED" };

      return { ok: true, conversationId };
    },

    async getRideStats(userId: string) {
      return this.getStats(userId);
    },
  };
}

export type TripApplication = ReturnType<typeof createTripApplication>;
