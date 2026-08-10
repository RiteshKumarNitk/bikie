import {
  auditRepository,
  messageRepository,
  moderationRepository,
  reportRepository,
} from "@bikie/database";
import { NotificationService } from "../../../notification.service";
import { RealtimeService } from "../../../lib/realtime";
import type {
  AuditLogPort,
  ModerationMessagePort,
  ModerationRepositoryPort,
  ReportRepositoryPort,
  TrustNotificationPort,
  TrustRealtimePort,
} from "../ports";

export function createReportRepositoryAdapter(): ReportRepositoryPort {
  return {
    create: (data) => reportRepository.create(data),
    findById: (id) => reportRepository.findById(id),
    findByIdWithRelations: (id) => reportRepository.findByIdWithRelations(id),
    findMany: (filters) => reportRepository.findMany(filters),
    updateStatus: (reportId, status, adminId, resolutionNote) =>
      reportRepository.updateStatus(reportId, status, adminId, resolutionNote),
  };
}

export function createModerationRepositoryAdapter(): ModerationRepositoryPort {
  return {
    listConversationsForModeration: async (page) => {
      const result = await moderationRepository.listConversationsForModeration(page);
      return {
        total: result.total,
        conversations: result.conversations.map((c) => ({
          id: c.id,
          subject: c.subject,
          isLocked: c.isLocked,
          trip: c.trip ? { title: c.trip.title } : null,
          _count: c._count,
          participants: c.participants.map((p) => ({
            user: { id: p.user.id, name: p.user.name, email: p.user.email },
          })),
          updatedAt: c.updatedAt,
        })),
      };
    },
    createAction: (data) => moderationRepository.createAction(data as never),
    lockConversation: (conversationId, adminId, locked) =>
      moderationRepository.lockConversation(conversationId, adminId, locked),
    deleteConversation: (conversationId) => moderationRepository.deleteConversation(conversationId),
    setAccountStatus: (userId, status, expiresAt) =>
      moderationRepository.setAccountStatus(userId, status, expiresAt),
  };
}

export function createModerationMessageAdapter(): ModerationMessagePort {
  return {
    findMessageById: (messageId) => messageRepository.findMessageById(messageId),
    deleteMessage: (messageId, actorId) => messageRepository.deleteMessage(messageId, actorId),
    getOtherParticipantIds: (conversationId, excludeUserId) =>
      messageRepository.getOtherParticipantIds(conversationId, excludeUserId),
    getMessagesRaw: (conversationId, take) => messageRepository.getMessagesRaw(conversationId, take),
  };
}

export function createTrustNotificationAdapter(): TrustNotificationPort {
  return {
    notify: (userId, type, title, body) =>
      NotificationService.notify(userId, type as never, title, body),
  };
}

export function createTrustRealtimeAdapter(): TrustRealtimePort {
  return {
    publishToAdmins: (event, payload) => RealtimeService.publishToAdmins(event, payload),
    publishToUsers: (userIds, event, payload) =>
      RealtimeService.publishToUsers(userIds, event, payload),
    publishToUser: (userId, event, payload) => RealtimeService.publishToUser(userId, event, payload),
  };
}

export function createAuditLogAdapter(): AuditLogPort {
  return {
    log: (params) => auditRepository.log(params),
  };
}
