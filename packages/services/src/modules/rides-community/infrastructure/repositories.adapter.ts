import {
  announcementRepository,
  messageRepository,
  tripRepository,
} from "@bikie/database";
import { NotificationService } from "../../../notification.service";
import { RealtimeService } from "../../../lib/realtime";
import type {
  AnnouncementRepositoryPort,
  ConversationLookupPort,
  RideNotificationPort,
  RideRealtimePort,
  SystemMessagePort,
  TripRepositoryPort,
  UnreadMessagesPort,
} from "../ports";

export function createTripRepositoryAdapter(): TripRepositoryPort {
  return {
    findTrips: (tab, filters) => tripRepository.findTrips(tab, filters),
    findBySlug: (slug) => tripRepository.findTripBySlug(slug),
    findRequestedBy: (userId) => tripRepository.findTripsRequestedBy(userId),
    findOrganizedBy: (userId) => tripRepository.findTripsOrganizedBy(userId),
    findJoinedBy: (userId) => tripRepository.findTripsJoinedBy(userId),
    findPendingRequestsForOrganizer: (userId) => tripRepository.findPendingRequestsForOrganizer(userId),
    getOrganizerDashboardMetrics: (userId) => tripRepository.getOrganizerDashboardMetrics(userId),
    getRideStatsForUser: (userId) => tripRepository.getRideStatsForUser(userId),
    createTrip: (data) => tripRepository.createTrip(data as never),
    updateTrip: (slug, data) => tripRepository.updateTrip(slug, data as never),
    findParticipant: (tripId, userId) => tripRepository.findParticipant(tripId, userId),
    findParticipantById: (id) => tripRepository.findParticipantById(id) as never,
    upsertJoinRequest: async (tripId, userId, message) => {
      await tripRepository.upsertJoinRequest(tripId, userId, message);
    },
    findPendingRequestsForTrip: (tripId) => tripRepository.findPendingRequestsForTrip(tripId),
    decideParticipant: async (id, status) => {
      await tripRepository.decideParticipant(id, status);
    },
    cancelParticipant: async (id) => {
      await tripRepository.cancelParticipant(id);
    },
    incrementSeatsLeft: (tripId) => tripRepository.incrementSeatsLeft(tripId),
    findConversationIdForTrip: (tripId) => tripRepository.findConversationIdForTrip(tripId),
    approveParticipantAtomically: (participantId, organizerId) =>
      tripRepository.approveParticipantAtomically(participantId, organizerId),
    getRoomInfo: (tripId) => tripRepository.getRoomInfo(tripId),
    updateMeetingPoint: async (tripId, data) => {
      await tripRepository.updateMeetingPoint(tripId, data);
    },
    updateEmergencyContacts: async (tripId, contacts) => {
      await tripRepository.updateEmergencyContacts(tripId, contacts);
    },
  };
}

export function createAnnouncementRepositoryAdapter(): AnnouncementRepositoryPort {
  return {
    findForTrip: (tripId) => announcementRepository.findForTrip(tripId),
    create: (tripId, authorId, content) => announcementRepository.create(tripId, authorId, content),
    findById: (id) => announcementRepository.findById(id),
    remove: (id) => announcementRepository.remove(id),
    findMediaForConversation: (conversationId, type) =>
      announcementRepository.findMediaForConversation(conversationId, type),
  };
}

export function createUnreadMessagesAdapter(): UnreadMessagesPort {
  return {
    countUnread: (userId) => messageRepository.countUnread(userId),
  };
}

export function createConversationLookupAdapter(): ConversationLookupPort {
  return {
    async getById(conversationId) {
      const conversation = await messageRepository.getConversationById(conversationId);
      return conversation ? { isLocked: conversation.isLocked } : null;
    },
    getOtherParticipantIds: (conversationId, excludeUserId) =>
      messageRepository.getOtherParticipantIds(conversationId, excludeUserId),
  };
}

/** Lazy import avoids circular load with messaging facade during module bootstrap. */
export function createSystemMessageAdapter(): SystemMessagePort {
  return {
    async create(conversationId, content, metadata) {
      const { MessageService } = await import("../../../message.service");
      await MessageService.createSystemMessage(conversationId, content, metadata);
    },
  };
}

export function createRideNotificationAdapter(): RideNotificationPort {
  return {
    notify: (userId, type, title, body, entity, entityId) =>
      NotificationService.notify(userId, type as never, title, body, entity, entityId),
    notifyMany: (userIds, type, title, body, entity, entityId) =>
      NotificationService.notifyMany(userIds, type as never, title, body, entity, entityId),
  };
}

export function createRideRealtimeAdapter(): RideRealtimePort {
  return {
    publishToUsers: (userIds, event, payload) =>
      RealtimeService.publishToUsers(userIds, event, payload),
  };
}
