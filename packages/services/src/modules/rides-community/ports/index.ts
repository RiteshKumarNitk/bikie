import type {
  AnnouncementDTO,
  EmergencyContactDTO,
  MediaItemDTO,
  MyRideRequestStatusDTO,
  RideJoinRequestDTO,
  RideRoomDTO,
  RideStatsDTO,
  TripDetailDTO,
  TripSummaryDTO,
} from "@bikie/types";
import type { CreateTripInput, UpdateTripInput } from "@bikie/validation";

export type TripListFilters = {
  destination?: string;
  difficulty?: string;
  from?: Date;
  to?: Date;
};

export type ApproveAtomicResult =
  | {
      ok: true;
      conversationId: string;
      tripId: string;
      tripSlug: string;
      tripTitle: string;
      organizerName: string;
      userId: string;
      userName: string;
    }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_DECIDED" | "NO_SEATS" };

export type ParticipantWithTrip = {
  id: string;
  userId: string;
  tripId: string;
  status: string;
  message: string | null;
  trip: {
    slug: string;
    organizerId: string;
    title: string;
    organizer: { name: string };
  };
  user: { name: string };
};

export interface TripRepositoryPort {
  findTrips(tab?: string, filters?: TripListFilters): Promise<TripSummaryDTO[]>;
  findBySlug(slug: string): Promise<TripDetailDTO | null>;
  findRequestedBy(userId: string): Promise<TripSummaryDTO[]>;
  findOrganizedBy(userId: string): Promise<TripSummaryDTO[]>;
  findJoinedBy(userId: string): Promise<TripSummaryDTO[]>;
  findPendingRequestsForOrganizer(userId: string): Promise<RideJoinRequestDTO[]>;
  getOrganizerDashboardMetrics(userId: string): Promise<{
    upcomingRides: number;
    pendingRequests: number;
  }>;
  getRideStatsForUser(userId: string): Promise<{
    ridesOrganized: number;
    requestsSent: number;
    requestsApproved: number;
    ridesCancelled: number;
  }>;
  createTrip(data: {
    title: string;
    description: string;
    imageUrl: string;
    type: string;
    difficulty: string;
    price: number;
    seatsTotal: number;
    meetingPoint?: string;
    startDate: Date;
    endDate: Date;
    organizerId: string;
    destinationId?: string;
  }): Promise<TripSummaryDTO>;
  updateTrip(slug: string, data: Record<string, unknown>): Promise<TripSummaryDTO>;
  findParticipant(tripId: string, userId: string): Promise<{ id: string; status: string; message: string | null } | null>;
  findParticipantById(participantId: string): Promise<ParticipantWithTrip | null>;
  upsertJoinRequest(tripId: string, userId: string, message?: string): Promise<void>;
  findPendingRequestsForTrip(tripId: string): Promise<
    Array<{
      id: string;
      message: string | null;
      createdAt: string;
      rider: { id: string; name: string; image: string | null };
    }>
  >;
  decideParticipant(participantId: string, status: "APPROVED" | "REJECTED"): Promise<void>;
  cancelParticipant(participantId: string): Promise<void>;
  incrementSeatsLeft(tripId: string): Promise<void>;
  findConversationIdForTrip(tripId: string): Promise<string | null>;
  approveParticipantAtomically(participantId: string, organizerId: string): Promise<ApproveAtomicResult>;
  getRoomInfo(tripId: string): Promise<{
    meetingPoint: string | null;
    meetingLat: number | null;
    meetingLng: number | null;
    emergencyContacts: unknown;
  } | null>;
  updateMeetingPoint(
    tripId: string,
    data: { meetingPoint?: string; meetingLat?: number; meetingLng?: number },
  ): Promise<void>;
  updateEmergencyContacts(
    tripId: string,
    contacts: { name: string; phone: string; relation: string }[],
  ): Promise<void>;
}

export interface AnnouncementRepositoryPort {
  findForTrip(tripId: string): Promise<
    Array<{
      id: string;
      tripId: string;
      authorId: string;
      author: { name: string };
      content: string;
      pinnedAt: Date | null;
      createdAt: Date;
    }>
  >;
  create(tripId: string, authorId: string, content: string): Promise<{
    id: string;
    tripId: string;
    authorId: string;
    author: { name: string };
    content: string;
    pinnedAt: Date | null;
    createdAt: Date;
  }>;
  findById(id: string): Promise<{ id: string; tripId: string } | null>;
  remove(id: string): Promise<void>;
  findMediaForConversation(
    conversationId: string,
    type?: "IMAGE" | "DOCUMENT",
  ): Promise<
    Array<{
      id: string;
      type: "IMAGE" | "DOCUMENT";
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      width: number | null;
      height: number | null;
      createdAt: Date;
    }>
  >;
}

export interface UnreadMessagesPort {
  countUnread(userId: string): Promise<number>;
}

export interface ConversationLookupPort {
  getById(conversationId: string): Promise<{ isLocked: boolean } | null>;
  getOtherParticipantIds(conversationId: string, excludeUserId: string): Promise<string[]>;
}

export interface SystemMessagePort {
  create(conversationId: string, content: string, metadata?: Record<string, unknown>): Promise<void>;
}

export interface RideNotificationPort {
  notify(
    userId: string,
    type: string,
    title: string,
    body: string,
    entity?: string,
    entityId?: string,
  ): Promise<void>;
  notifyMany(
    userIds: string[],
    type: string,
    title: string,
    body: string,
    entity?: string,
    entityId?: string,
  ): Promise<void>;
}

export interface RideRealtimePort {
  publishToUsers(userIds: string[], event: string, payload: unknown): Promise<void>;
}

export interface RidesCommunityPorts {
  trips: TripRepositoryPort;
  announcements: AnnouncementRepositoryPort;
  unread: UnreadMessagesPort;
  conversations: ConversationLookupPort;
  systemMessages: SystemMessagePort;
  notifications: RideNotificationPort;
  realtime: RideRealtimePort;
}

export type {
  AnnouncementDTO,
  CreateTripInput,
  EmergencyContactDTO,
  MediaItemDTO,
  MyRideRequestStatusDTO,
  RideJoinRequestDTO,
  RideRoomDTO,
  RideStatsDTO,
  TripDetailDTO,
  TripSummaryDTO,
  UpdateTripInput,
};
