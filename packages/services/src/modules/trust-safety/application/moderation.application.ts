import type { ModerationConversationSummaryDTO } from "@bikie/types";
import { decryptMessageContent } from "../../../lib/message-crypto";
import { moderationExpiresAt } from "../domain/moderation";
import type { TrustSafetyPorts } from "../ports";

export function createModerationApplication(ports: TrustSafetyPorts) {
  return {
    async listConversations(
      page: number,
    ): Promise<{ conversations: ModerationConversationSummaryDTO[]; total: number }> {
      const { conversations, total } = await ports.moderation.listConversationsForModeration(page);
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
      const existing = await ports.messages.findMessageById(messageId);
      if (!existing) return { ok: false, reason: "NOT_FOUND" };

      await ports.messages.deleteMessage(messageId, adminId);
      await ports.moderation.createAction({
        adminId,
        type: "DELETE_MESSAGE",
        reason,
        reportId,
        relatedEntity: "Message",
        relatedEntityId: messageId,
      });

      const otherIds = await ports.messages.getOtherParticipantIds(existing.conversationId, adminId);
      await ports.realtime.publishToUsers(otherIds, "message_deleted", {
        id: messageId,
        conversationId: existing.conversationId,
      });

      return { ok: true };
    },

    async setConversationLocked(
      conversationId: string,
      adminId: string,
      locked: boolean,
      reason: string,
    ): Promise<void> {
      await ports.moderation.lockConversation(conversationId, adminId, locked);
      await ports.moderation.createAction({
        adminId,
        type: "CLOSE_RIDE_ROOM",
        reason,
        relatedEntity: "Conversation",
        relatedEntityId: conversationId,
      });
    },

    async deleteConversation(conversationId: string, adminId: string, reason: string): Promise<void> {
      await ports.moderation.createAction({
        adminId,
        type: "DELETE_RIDE_ROOM",
        reason,
        relatedEntity: "Conversation",
        relatedEntityId: conversationId,
      });
      await ports.moderation.deleteConversation(conversationId);
    },

    async warnUser(targetUserId: string, adminId: string, reason: string, reportId?: string) {
      await ports.moderation.createAction({
        targetUserId,
        adminId,
        type: "WARN",
        reason,
        reportId,
      });
      await ports.notifications.notify(targetUserId, "MODERATION_ACTION", "Account warning", reason);
      await ports.realtime.publishToUser(targetUserId, "moderation_action", { type: "WARN", reason });
    },

    async muteUser(
      targetUserId: string,
      adminId: string,
      reason: string,
      durationHours: number,
      reportId?: string,
    ) {
      const expiresAt = moderationExpiresAt(durationHours);
      await ports.moderation.setAccountStatus(targetUserId, "MUTED", expiresAt);
      await ports.moderation.createAction({
        targetUserId,
        adminId,
        type: "MUTE",
        reason,
        reportId,
        expiresAt,
      });
      await ports.notifications.notify(targetUserId, "MODERATION_ACTION", "You've been muted", reason);
      await ports.realtime.publishToUser(targetUserId, "moderation_action", {
        type: "MUTE",
        reason,
        expiresAt: expiresAt.toISOString(),
      });
    },

    async suspendUser(
      targetUserId: string,
      adminId: string,
      reason: string,
      durationHours: number,
      reportId?: string,
    ) {
      const expiresAt = moderationExpiresAt(durationHours);
      await ports.moderation.setAccountStatus(targetUserId, "SUSPENDED", expiresAt);
      await ports.moderation.createAction({
        targetUserId,
        adminId,
        type: "SUSPEND",
        reason,
        reportId,
        expiresAt,
      });
      await ports.notifications.notify(
        targetUserId,
        "MODERATION_ACTION",
        "Your account has been suspended",
        reason,
      );
      await ports.realtime.publishToUser(targetUserId, "moderation_action", {
        type: "SUSPEND",
        reason,
        expiresAt: expiresAt.toISOString(),
      });
    },

    async banUser(targetUserId: string, adminId: string, reason: string, reportId?: string) {
      await ports.moderation.setAccountStatus(targetUserId, "BANNED", null);
      await ports.moderation.createAction({
        targetUserId,
        adminId,
        type: "BAN",
        reason,
        reportId,
      });
      await ports.notifications.notify(
        targetUserId,
        "MODERATION_ACTION",
        "Your account has been banned",
        reason,
      );
      await ports.realtime.publishToUser(targetUserId, "moderation_action", { type: "BAN", reason });
    },

    /** §34 — gated, audited admin view of conversation content for trust/safety
     * investigations. Every access creates an AuditLog entry (admin ID, conversation ID,
     * reason, timestamp) before any content is returned. Returns decrypted messages
     * (the admin's own session has no access to the message encryption key, but the
     * server does — `message-crypto.ts` decrypts here, not on the client). */
    async getMessagesForModeration(conversationId: string, adminId: string, reason: string) {
      const messages = await ports.messages.getMessagesRaw(conversationId, 200);

      const decrypted = messages.map((m: any) => {
        if (m.type === "SYSTEM") {
          return { id: m.id, type: m.type, content: m.content, senderId: m.senderId, createdAt: m.createdAt.toISOString() };
        }
        let content = m.content; // fallback: unencrypted TEXT
        if (m.ciphertext && m.iv && m.authTag) {
          try {
            content = decryptMessageContent(m);
          } catch {
            content = "[encrypted — unable to decrypt]";
          }
        }
        return {
          id: m.id,
          type: m.type,
          content,
          senderId: m.senderId,
          senderName: m.sender?.name ?? null,
          createdAt: m.createdAt.toISOString(),
        };
      });

      await ports.audit.log({
        userId: adminId,
        action: "ADMIN_CONVERSATION_READ",
        entity: "Conversation",
        entityId: conversationId,
        metadata: { reason },
      });

      return decrypted;
    },

    async restoreUser(targetUserId: string, adminId: string, reason: string) {
      await ports.moderation.setAccountStatus(targetUserId, "ACTIVE", null);
      await ports.moderation.createAction({
        targetUserId,
        adminId,
        type: "UNBAN",
        reason,
      });
      await ports.notifications.notify(
        targetUserId,
        "MODERATION_ACTION",
        "Your account has been restored",
        reason,
      );
    },
  };
}

export type ModerationApplication = ReturnType<typeof createModerationApplication>;
