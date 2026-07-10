import { messageRepository, moderationRepository, reportRepository } from "@bikie/database";
import type { ModerationConversationSummaryDTO, ReportDTO } from "@bikie/types";
import { RealtimeService } from "./lib/realtime";
import { NotificationService } from "./notification.service";

type ReportRow = NonNullable<Awaited<ReturnType<typeof reportRepository.findByIdWithRelations>>>;

function toReportDTO(row: ReportRow): ReportDTO {
  return {
    id: row.id,
    reporter: row.reporter,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    details: row.details,
    status: row.status,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    createdAt: row.createdAt.toISOString(),
  };
}

export const ReportService = {
  async create(
    reporterId: string,
    input: {
      targetType: "MESSAGE" | "USER" | "TRIP" | "CONVERSATION" | "GROUP";
      targetId: string;
      reason: "SPAM" | "ABUSE" | "FAKE_ACCOUNT" | "DANGEROUS_BEHAVIOUR" | "HARASSMENT" | "SCAM" | "OTHER";
      details?: string;
    },
  ): Promise<ReportDTO> {
    const row = await reportRepository.create({ reporterId, ...input });
    const full = await reportRepository.findByIdWithRelations(row.id);
    const dto = toReportDTO(full!);
    await RealtimeService.publishToAdmins("report_created", dto);
    return dto;
  },

  async list(filters: { status?: string; targetType?: string }): Promise<ReportDTO[]> {
    const rows = await reportRepository.findMany(filters);
    return rows.map(toReportDTO);
  },

  async updateStatus(
    reportId: string,
    adminId: string,
    status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED",
    resolutionNote?: string,
  ): Promise<ReportDTO | null> {
    const existing = await reportRepository.findById(reportId);
    if (!existing) return null;
    const updated = await reportRepository.updateStatus(reportId, status, adminId, resolutionNote);
    const full = await reportRepository.findByIdWithRelations(updated.id);
    return toReportDTO(full!);
  },
};

export const ModerationService = {
  async listConversations(page: number): Promise<{ conversations: ModerationConversationSummaryDTO[]; total: number }> {
    const { conversations, total } = await moderationRepository.listConversationsForModeration(page);
    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        subject: c.subject,
        isLocked: c.isLocked,
        tripTitle: c.trip?.title ?? null,
        messageCount: c._count.messages,
        participants: c.participants.map((p) => p.user),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
    };
  },

  async deleteMessage(
    messageId: string,
    adminId: string,
    reason: string,
    reportId?: string,
  ): Promise<{ ok: true } | { ok: false; reason: "NOT_FOUND" }> {
    const existing = await messageRepository.findMessageById(messageId);
    if (!existing) return { ok: false, reason: "NOT_FOUND" };

    await messageRepository.deleteMessage(messageId, adminId);
    await moderationRepository.createAction({
      adminId,
      type: "DELETE_MESSAGE",
      reason,
      reportId,
      relatedEntity: "Message",
      relatedEntityId: messageId,
    });

    const otherIds = await messageRepository.getOtherParticipantIds(existing.conversationId, adminId);
    await RealtimeService.publishToUsers(otherIds, "message_deleted", { id: messageId, conversationId: existing.conversationId });

    return { ok: true };
  },

  async setConversationLocked(
    conversationId: string,
    adminId: string,
    locked: boolean,
    reason: string,
  ): Promise<void> {
    await moderationRepository.lockConversation(conversationId, adminId, locked);
    await moderationRepository.createAction({
      adminId,
      type: "CLOSE_RIDE_ROOM",
      reason,
      relatedEntity: "Conversation",
      relatedEntityId: conversationId,
    });
  },

  async deleteConversation(conversationId: string, adminId: string, reason: string): Promise<void> {
    await moderationRepository.createAction({
      adminId,
      type: "DELETE_RIDE_ROOM",
      reason,
      relatedEntity: "Conversation",
      relatedEntityId: conversationId,
    });
    await moderationRepository.deleteConversation(conversationId);
  },

  async warnUser(targetUserId: string, adminId: string, reason: string, reportId?: string): Promise<void> {
    await moderationRepository.createAction({ targetUserId, adminId, type: "WARN", reason, reportId });
    await NotificationService.notify(targetUserId, "MODERATION_ACTION", "Account warning", reason);
    await RealtimeService.publishToUser(targetUserId, "moderation_action", { type: "WARN", reason });
  },

  async muteUser(targetUserId: string, adminId: string, reason: string, durationHours: number, reportId?: string): Promise<void> {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    await moderationRepository.setAccountStatus(targetUserId, "MUTED", expiresAt);
    await moderationRepository.createAction({ targetUserId, adminId, type: "MUTE", reason, reportId, expiresAt });
    await NotificationService.notify(targetUserId, "MODERATION_ACTION", "You've been muted", reason);
    await RealtimeService.publishToUser(targetUserId, "moderation_action", { type: "MUTE", reason, expiresAt: expiresAt.toISOString() });
  },

  async suspendUser(targetUserId: string, adminId: string, reason: string, durationHours: number, reportId?: string): Promise<void> {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    await moderationRepository.setAccountStatus(targetUserId, "SUSPENDED", expiresAt);
    await moderationRepository.createAction({ targetUserId, adminId, type: "SUSPEND", reason, reportId, expiresAt });
    await NotificationService.notify(targetUserId, "MODERATION_ACTION", "Your account has been suspended", reason);
    await RealtimeService.publishToUser(targetUserId, "moderation_action", { type: "SUSPEND", reason, expiresAt: expiresAt.toISOString() });
  },

  async banUser(targetUserId: string, adminId: string, reason: string, reportId?: string): Promise<void> {
    await moderationRepository.setAccountStatus(targetUserId, "BANNED", null);
    await moderationRepository.createAction({ targetUserId, adminId, type: "BAN", reason, reportId });
    await NotificationService.notify(targetUserId, "MODERATION_ACTION", "Your account has been banned", reason);
    await RealtimeService.publishToUser(targetUserId, "moderation_action", { type: "BAN", reason });
  },

  async restoreUser(targetUserId: string, adminId: string, reason: string): Promise<void> {
    await moderationRepository.setAccountStatus(targetUserId, "ACTIVE", null);
    await moderationRepository.createAction({ targetUserId, adminId, type: "UNBAN", reason });
    await NotificationService.notify(targetUserId, "MODERATION_ACTION", "Your account has been restored", reason);
  },
};
