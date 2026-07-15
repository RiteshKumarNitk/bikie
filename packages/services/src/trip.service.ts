import { messageRepository, tripRepository } from "@bikie/database";
import type {
  MyRideRequestStatusDTO,
  RideJoinRequestDTO,
  RideStatsDTO,
  TripDetailDTO,
  TripSummaryDTO,
} from "@bikie/types";
import type { CreateTripInput, UpdateTripInput } from "@bikie/validation";
import { MessageService } from "./message.service";
import { NotificationService } from "./notification.service";

const DEFAULT_TRIP_IMAGE = "https://picsum.photos/seed/ride-default/900/600";

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

export interface TripListFilters {
  destination?: string;
  difficulty?: string;
  from?: Date;
  to?: Date;
}

export const TripService = {
  async getByTab(tab?: string, filters?: TripListFilters): Promise<TripSummaryDTO[]> {
    return tripRepository.findTrips(tab, filters);
  },

  async getBySlug(slug: string): Promise<TripDetailDTO | null> {
    return tripRepository.findTripBySlug(slug);
  },

  async getRequestedBy(userId: string): Promise<TripSummaryDTO[]> {
    return tripRepository.findTripsRequestedBy(userId);
  },

  async getAllPendingRequests(userId: string): Promise<RideJoinRequestDTO[]> {
    return tripRepository.findPendingRequestsForOrganizer(userId);
  },

  async getOverview(userId: string): Promise<any> {
    const metrics = await tripRepository.getOrganizerDashboardMetrics(userId);
    const unreadMessages = await messageRepository.countUnread(userId);
    
    // Calculate rides starting tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Construct actionable items
    const actionableItems = [];
    if (metrics.pendingRequests > 0) {
      actionableItems.push({
        id: "pending-requests",
        type: "PENDING_APPROVALS",
        title: `${metrics.pendingRequests} Riders waiting approval`,
        actionLabel: "Manage Requests",
        actionHref: "/dashboard/requests"
      });
    }
    
    if (unreadMessages > 0) {
      actionableItems.push({
        id: "unread-messages",
        type: "UNREAD_MESSAGES",
        title: `${unreadMessages} unread messages`,
        actionLabel: "Open Chat",
        actionHref: "/dashboard/messages"
      });
    }

    return {
      stats: {
        upcomingRides: metrics.upcomingRides,
        pendingRequests: metrics.pendingRequests,
        unreadMessages,
        ridesTomorrow: 0
      },
      actionableItems
    };
  },


  async getStats(userId: string): Promise<RideStatsDTO> {
    const stats = await tripRepository.getRideStatsForUser(userId);
    const approvalRate =
      stats.requestsSent > 0 ? Math.round((stats.requestsApproved / stats.requestsSent) * 100) : null;
    return { ...stats, approvalRate };
  },

  async getOrganizedBy(userId: string): Promise<TripSummaryDTO[]> {
    return tripRepository.findTripsOrganizedBy(userId);
  },

  async getJoinedBy(userId: string): Promise<TripSummaryDTO[]> {
    return tripRepository.findTripsJoinedBy(userId);
  },


  async create(organizerId: string, input: CreateTripInput): Promise<TripSummaryDTO> {
    return tripRepository.createTrip({
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl ?? DEFAULT_TRIP_IMAGE,
      type: input.type,
      difficulty: input.difficulty,
      price: input.price,
      seatsTotal: input.seatsTotal,
      meetingPoint: input.meetingPoint,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      organizerId,
      destinationId: input.destinationId,
    });
  },

  async update(slug: string, userId: string, input: UpdateTripInput): Promise<{ ok: boolean; reason?: string; trip?: TripSummaryDTO }> {
    const trip = await tripRepository.findTripBySlug(slug);
    if (!trip) return { ok: false, reason: "NOT_FOUND" };
    if (trip.organizer.id !== userId) return { ok: false, reason: "FORBIDDEN" };

    const updated = await tripRepository.updateTrip(slug, {
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl === null ? "" : input.imageUrl !== undefined ? input.imageUrl : undefined,
      type: input.type as never,
      difficulty: input.difficulty as never,
      price: input.price,
      seatsTotal: input.seatsTotal,
      meetingPoint: input.meetingPoint,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      destinationId: input.destinationId,
    });

    const conversationId = await tripRepository.findConversationIdForTrip(trip.id);
    if (conversationId) {
      await MessageService.createSystemMessage(conversationId, `The ride details were updated by the organizer.`, {
        event: "TRIP_UPDATED",
      });
    }

    return { ok: true, trip: updated };
  },

  async requestToJoin(slug: string, userId: string, message?: string): Promise<RequestToJoinResult> {
    const trip = await tripRepository.findTripBySlug(slug);
    if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };
    if (trip.status !== "UPCOMING") return { ok: false, reason: "NOT_OPEN" };
    if (trip.organizer.id === userId) return { ok: false, reason: "IS_ORGANIZER" };
    if (trip.seatsLeft <= 0) return { ok: false, reason: "FULL" };

    const existing = await tripRepository.findParticipant(trip.id, userId);
    if (existing && (existing.status === "PENDING" || existing.status === "APPROVED")) {
      return { ok: false, reason: "ALREADY_REQUESTED" };
    }

    await tripRepository.upsertJoinRequest(trip.id, userId, message);
    await NotificationService.notify(
      trip.organizer.id,
      "RIDE_REQUEST_RECEIVED",
      "New ride request",
      `Someone requested to join "${trip.title}".`,
      "Trip",
      trip.id,
    );
    return { ok: true };
  },

  async getMyRequestStatus(slug: string, userId: string): Promise<MyRideRequestStatusDTO | null> {
    const trip = await tripRepository.findTripBySlug(slug);
    if (!trip) return null;
    const participant = await tripRepository.findParticipant(trip.id, userId);
    return participant ? { status: participant.status, message: participant.message } : null;
  },

  async getPendingRequests(slug: string, organizerId: string): Promise<GetRequestsResult> {
    const trip = await tripRepository.findTripBySlug(slug);
    if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };
    if (trip.organizer.id !== organizerId) return { ok: false, reason: "FORBIDDEN" };
    const requests = await tripRepository.findPendingRequestsForTrip(trip.id);
    return { 
      ok: true, 
      requests: requests.map(r => ({
        ...r,
        tripId: trip.id,
        tripSlug: trip.slug,
        tripTitle: trip.title
      }))
    };
  },

  async decideRequest(
    participantId: string,
    organizerId: string,
    decision: "APPROVED" | "REJECTED",
  ): Promise<DecideRequestResult> {
    const participant = await tripRepository.findParticipantById(participantId);
    if (!participant) return { ok: false, reason: "NOT_FOUND" };
    if (participant.trip.organizerId !== organizerId) return { ok: false, reason: "FORBIDDEN" };
    if (participant.status !== "PENDING") return { ok: false, reason: "ALREADY_DECIDED" };

    if (decision === "REJECTED") {
      await tripRepository.decideParticipant(participantId, "REJECTED");
      await NotificationService.notify(
        participant.userId,
        "RIDE_REQUEST_REJECTED",
        "Ride request declined",
        `Your request to join "${participant.trip.title}" was declined.`,
        "Trip",
        participant.tripId,
      );
      return { ok: true };
    }

    const seatAvailable = await tripRepository.decrementSeatsLeft(participant.tripId);
    if (!seatAvailable) return { ok: false, reason: "NO_SEATS" };

    await tripRepository.decideParticipant(participantId, "APPROVED");

    const { conversationId } = await tripRepository.getOrCreateRideConversation(
      participant.tripId,
      organizerId,
      participant.userId,
      participant.trip.title,
    );

    await MessageService.createSystemMessage(
      conversationId,
      `${participant.trip.organizer.name} approved ${participant.user.name}.`,
      { event: "USER_JOINED", userId: participant.userId, userName: participant.user.name }
    );
    await NotificationService.notify(
      participant.userId,
      "RIDE_REQUEST_APPROVED",
      "Ride request approved",
      `You're in! Your request to join "${participant.trip.title}" was approved.`,
      "Trip",
      participant.tripId,
    );

    return { ok: true };
  },

  async leaveRide(slug: string, userId: string, userName: string): Promise<LeaveRideResult> {
    const trip = await tripRepository.findTripBySlug(slug);
    if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };

    const participant = await tripRepository.findParticipant(trip.id, userId);
    if (!participant || (participant.status !== "PENDING" && participant.status !== "APPROVED")) {
      return { ok: false, reason: "NOT_A_PARTICIPANT" };
    }

    const wasApproved = participant.status === "APPROVED";
    await tripRepository.cancelParticipant(participant.id);
    if (wasApproved) {
      await tripRepository.incrementSeatsLeft(trip.id);
      const conversationId = await tripRepository.findConversationIdForTrip(trip.id);
      if (conversationId) {
        await MessageService.createSystemMessage(conversationId, `${userName} left the ride.`, {
          event: "USER_LEFT",
          userId,
          userName,
        });
      }
    }

    return { ok: true };
  },

  async getGroup(slug: string, userId: string): Promise<GetGroupResult> {
    const trip = await tripRepository.findTripBySlug(slug);
    if (!trip) return { ok: false, reason: "TRIP_NOT_FOUND" };

    const isOrganizer = trip.organizer.id === userId;
    const participant = isOrganizer ? null : await tripRepository.findParticipant(trip.id, userId);
    const isApprovedMember = participant?.status === "APPROVED";
    if (!isOrganizer && !isApprovedMember) return { ok: false, reason: "FORBIDDEN" };

    const conversationId = await tripRepository.findConversationIdForTrip(trip.id);
    if (!conversationId) return { ok: false, reason: "NOT_STARTED" };

    return { ok: true, conversationId };
  },

  async getRideStats(userId: string): Promise<RideStatsDTO> {
    const stats = await tripRepository.getRideStatsForUser(userId);
    const approvalRate =
      stats.requestsSent > 0 ? Math.round((stats.requestsApproved / stats.requestsSent) * 100) : null;
    return { ...stats, approvalRate };
  },
};
