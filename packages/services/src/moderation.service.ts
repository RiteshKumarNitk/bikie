import { getTrustSafetyModule } from "./modules/trust-safety/public";
import type { ModerationConversationSummaryDTO, ReportDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing ReportService. */
export const ReportService = {
  create(
    reporterId: string,
    input: {
      targetType: "MESSAGE" | "USER" | "TRIP" | "CONVERSATION" | "GROUP";
      targetId: string;
      reason: "SPAM" | "ABUSE" | "FAKE_ACCOUNT" | "DANGEROUS_BEHAVIOUR" | "HARASSMENT" | "SCAM" | "OTHER";
      details?: string;
    },
  ): Promise<ReportDTO> {
    return getTrustSafetyModule().reports.create(reporterId, input);
  },

  list(filters: { status?: string; targetType?: string }): Promise<ReportDTO[]> {
    return getTrustSafetyModule().reports.list(filters);
  },

  updateStatus(
    reportId: string,
    adminId: string,
    status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED",
    resolutionNote?: string,
  ): Promise<ReportDTO | null> {
    return getTrustSafetyModule().reports.updateStatus(reportId, adminId, status, resolutionNote);
  },
};

/** Compatibility facade — routes keep importing ModerationService. */
export const ModerationService = {
  listConversations(
    page: number,
  ): Promise<{ conversations: ModerationConversationSummaryDTO[]; total: number }> {
    return getTrustSafetyModule().moderation.listConversations(page);
  },

  deleteMessage(messageId: string, adminId: string, reason: string, reportId?: string) {
    return getTrustSafetyModule().moderation.deleteMessage(messageId, adminId, reason, reportId);
  },

  setConversationLocked(conversationId: string, adminId: string, locked: boolean, reason: string) {
    return getTrustSafetyModule().moderation.setConversationLocked(
      conversationId,
      adminId,
      locked,
      reason,
    );
  },

  deleteConversation(conversationId: string, adminId: string, reason: string) {
    return getTrustSafetyModule().moderation.deleteConversation(conversationId, adminId, reason);
  },

  warnUser(targetUserId: string, adminId: string, reason: string, reportId?: string) {
    return getTrustSafetyModule().moderation.warnUser(targetUserId, adminId, reason, reportId);
  },

  muteUser(
    targetUserId: string,
    adminId: string,
    reason: string,
    durationHours: number,
    reportId?: string,
  ) {
    return getTrustSafetyModule().moderation.muteUser(
      targetUserId,
      adminId,
      reason,
      durationHours,
      reportId,
    );
  },

  suspendUser(
    targetUserId: string,
    adminId: string,
    reason: string,
    durationHours: number,
    reportId?: string,
  ) {
    return getTrustSafetyModule().moderation.suspendUser(
      targetUserId,
      adminId,
      reason,
      durationHours,
      reportId,
    );
  },

  banUser(targetUserId: string, adminId: string, reason: string, reportId?: string) {
    return getTrustSafetyModule().moderation.banUser(targetUserId, adminId, reason, reportId);
  },

  restoreUser(targetUserId: string, adminId: string, reason: string) {
    return getTrustSafetyModule().moderation.restoreUser(targetUserId, adminId, reason);
  },

  /** §34 — gated, audited admin view of conversation content for trust/safety investigations.
   * Every access is audit-logged. Content is decrypted server-side. */
  getMessagesForModeration(conversationId: string, adminId: string, reason: string) {
    return getTrustSafetyModule().moderation.getMessagesForModeration(conversationId, adminId, reason);
  },
};
