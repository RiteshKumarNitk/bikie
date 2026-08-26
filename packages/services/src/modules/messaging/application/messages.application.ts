import type { ConversationDTO, MessageAttachmentDTO, MessageDTO, MessageReceiptDTO } from "@bikie/types";
import { DEFAULT_MESSAGE_HISTORY_LIMIT } from "../domain/history";
import { isAccountMuted } from "../domain/mute";
import type { MessagingPorts } from "../ports";

type RawMessage = Awaited<ReturnType<MessagingPorts["store"]["getMessagesRaw"]>>[number];

function toAttachmentDTO(a: RawMessage["attachments"][number]): MessageAttachmentDTO {
  return {
    id: a.id,
    type: a.type,
    fileName: a.fileName,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    width: a.width,
    height: a.height,
  };
}

function toReceiptDTO(r: RawMessage["receipts"][number]): MessageReceiptDTO {
  return {
    userId: r.userId,
    deliveredAt: r.deliveredAt?.toISOString() ?? null,
    readAt: r.readAt?.toISOString() ?? null,
  };
}

function toReactionDTO(r: RawMessage["reactions"][number]) {
  return {
    emoji: r.emoji,
    userId: r.userId,
    createdAt: r.createdAt.toISOString(),
  };
}

function decryptRow(ports: MessagingPorts, row: RawMessage): string | null {
  if (row.type === "SYSTEM") return row.content;
  if (row.deletedAt) return null;
  if (!row.ciphertext || !row.iv || !row.authTag || row.encryptionVersion === null) {
    return row.content || null;
  }
  try {
    return ports.crypto.decrypt({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.authTag,
      encryptionVersion: row.encryptionVersion,
    });
  } catch (err) {
    console.error("Failed to decrypt message:", row.id, err);
    return row.content || null;
  }
}

function toDTO(ports: MessagingPorts, row: RawMessage): MessageDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName: row.sender?.name ?? null,
    senderImage: row.sender?.image ?? null,
    type: row.type,
    content: decryptRow(ports, row),
    metadata: row.metadata ?? null,
    replyToId: row.replyToId,
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    attachments: row.attachments.map(toAttachmentDTO),
    receipts: row.receipts.map(toReceiptDTO),
    reactions: row.reactions.map(toReactionDTO),
    createdAt: row.createdAt.toISOString(),
  };
}

export function createMessagesApplication(ports: MessagingPorts) {
  return {
    async getConversations(userId: string): Promise<ConversationDTO[]> {
      const rows = await ports.store.getConversationsForUser(userId);
      return rows.map((conv) => ({
        id: conv.id,
        subject: conv.subject,
        isLocked: conv.isLocked,
        participants: conv.participants,
        lastMessage: conv.lastMessage
          ? {
              content:
                conv.lastMessage.type === "SYSTEM"
                  ? conv.lastMessage.content
                  : decryptRow(ports, conv.lastMessage as RawMessage),
              createdAt: conv.lastMessage.createdAt.toISOString(),
              senderId: conv.lastMessage.senderId,
            }
          : null,
        unreadCount: 0,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    },

    async getMessages(conversationId: string, userId: string, isAdmin = false) {
      const participant = await ports.store.isParticipant(conversationId, userId);
      if (!participant && !isAdmin) return null;

      const rows = await ports.store.getMessagesRaw(conversationId, DEFAULT_MESSAGE_HISTORY_LIMIT);
      if (participant) {
        await ports.store.markDelivered(conversationId, userId);
      }
      return { messages: rows.map((row) => toDTO(ports, row)), viewedAsAdmin: !participant && isAdmin };
    },

    async sendMessage(
      conversationId: string,
      senderId: string,
      input: {
        content?: string;
        replyToId?: string;
        attachments?: Parameters<MessagingPorts["store"]["sendMessage"]>[0]["attachments"];
      },
    ) {
      // Same membership check `getMessages` already applies on read — a non-participant gets
      // the same "not found" shape rather than a distinguishable 403, so probing a conversation
      // id can't confirm it exists. No admin override here (unlike getMessages' moderation-view
      // path): there's no existing precedent for an admin injecting messages into a conversation
      // they aren't part of, so this stays strict.
      const participant = await ports.store.isParticipant(conversationId, senderId);
      if (!participant) return { ok: false as const, reason: "NOT_FOUND" as const };

      const locked = await ports.store.isConversationLocked(conversationId);
      if (locked) return { ok: false as const, reason: "LOCKED" as const };

      const status = await ports.accountStatus.getAccountStatus(senderId);
      if (isAccountMuted(status ?? {})) return { ok: false as const, reason: "MUTED" as const };

      const encrypted = input.content ? ports.crypto.encrypt(input.content) : undefined;

      const row = await ports.store.sendMessage({
        conversationId,
        senderId,
        type: "TEXT",
        ciphertext: encrypted?.ciphertext,
        iv: encrypted?.iv,
        authTag: encrypted?.authTag,
        encryptionVersion: encrypted?.encryptionVersion,
        replyToId: input.replyToId,
        attachments: input.attachments,
      });

      const dto = toDTO(ports, row);
      const otherIds = await ports.store.getOtherParticipantIds(conversationId, senderId);
      await ports.realtime.publishToUsers(otherIds, "new_message", dto);
      const preview = dto.content ? dto.content.slice(0, 140) : "Sent an attachment";
      await ports.notifications
        .notifyMany(otherIds, "NEW_MESSAGE", "New message", preview, "conversation", conversationId)
        .catch(console.error);
      return { ok: true as const, message: dto };
    },

    async createSystemMessage(conversationId: string, content: string, metadata?: unknown) {
      const row = await ports.store.sendMessage({
        conversationId,
        senderId: null,
        type: "SYSTEM",
        content,
        metadata,
      });
      const dto = toDTO(ports, row);
      const allIds = await ports.store.getParticipantIds(conversationId);
      await ports.realtime.publishToUsers(allIds, "new_message", dto);
      return dto;
    },

    async editMessage(messageId: string, userId: string, content: string) {
      const existing = await ports.store.findMessageById(messageId);
      if (!existing) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (existing.senderId !== userId) return { ok: false as const, reason: "FORBIDDEN" as const };
      if (existing.deletedAt) return { ok: false as const, reason: "DELETED" as const };

      const encrypted = ports.crypto.encrypt(content);
      const row = await ports.store.editMessage(messageId, encrypted);
      const dto = toDTO(ports, row);
      const otherIds = await ports.store.getOtherParticipantIds(row.conversationId, userId);
      await ports.realtime.publishToUsers(otherIds, "message_edited", dto);
      return { ok: true as const, message: dto };
    },

    async deleteOwnMessage(messageId: string, userId: string) {
      const existing = await ports.store.findMessageById(messageId);
      if (!existing) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (existing.senderId !== userId) return { ok: false as const, reason: "FORBIDDEN" as const };

      const row = await ports.store.deleteMessage(messageId, userId);
      const dto = toDTO(ports, row);
      const otherIds = await ports.store.getOtherParticipantIds(row.conversationId, userId);
      await ports.realtime.publishToUsers(otherIds, "message_deleted", dto);
      return { ok: true as const, message: dto };
    },

    async markRead(conversationId: string, userId: string, upToMessageId: string) {
      const senderIds = await ports.store.markRead(conversationId, userId, upToMessageId);
      await ports.realtime.publishToUsers(senderIds, "message_read", {
        conversationId,
        userId,
        upToMessageId,
      });
    },

    async setTyping(conversationId: string, userId: string, isTyping: boolean) {
      await ports.realtime.publishTyping(conversationId, userId, isTyping);
      const otherIds = await ports.store.getOtherParticipantIds(conversationId, userId);
      await ports.realtime.publishToUsers(otherIds, "typing", { conversationId, userId, isTyping });
    },

    async getOrCreateConversation(userId: string, otherUserId: string, subject?: string) {
      const existing = await ports.store.findConversationByParticipants([userId, otherUserId]);
      if (existing) return existing;
      return ports.store.createConversation([userId, otherUserId], subject);
    },

    async reactToMessage(messageId: string, userId: string, emoji: string) {
      const message = await ports.store.findMessageById(messageId);
      if (!message) return { ok: false as const, reason: "NOT_FOUND" as const };

      await ports.store.addReaction(messageId, userId, emoji);
      const otherIds = await ports.store.getOtherParticipantIds(message.conversationId, userId);
      await ports.realtime.publishToUsers(otherIds, "reaction_added", { messageId, userId, emoji });
      return { ok: true as const };
    },

    async removeReaction(messageId: string, userId: string, emoji: string) {
      const message = await ports.store.findMessageById(messageId);
      if (!message) return { ok: false as const, reason: "NOT_FOUND" as const };

      await ports.store.removeReaction(messageId, userId, emoji);
      const otherIds = await ports.store.getOtherParticipantIds(message.conversationId, userId);
      await ports.realtime.publishToUsers(otherIds, "reaction_removed", { messageId, userId, emoji });
      return { ok: true as const };
    },
  };
}

export type MessagesApplication = ReturnType<typeof createMessagesApplication>;
