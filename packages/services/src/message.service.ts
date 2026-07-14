import { messageRepository, moderationRepository } from "@bikie/database";
import type { ConversationDTO, MessageAttachmentDTO, MessageDTO, MessageReceiptDTO } from "@bikie/types";
import { decryptMessageContent, encryptMessageContent } from "./lib/message-crypto";
import { RealtimeService } from "./lib/realtime";

type RawMessage = Awaited<ReturnType<typeof messageRepository.getMessagesRaw>>[number];

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

function decryptRow(row: RawMessage): string | null {
  if (row.type === "SYSTEM") return row.content;
  if (row.deletedAt) return null;
  if (!row.ciphertext || !row.iv || !row.authTag || row.encryptionVersion === null) return null;
  try {
    return decryptMessageContent({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.authTag,
      encryptionVersion: row.encryptionVersion,
    });
  } catch {
    return null;
  }
}

function toDTO(row: RawMessage): MessageDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName: row.sender?.name ?? null,
    senderImage: row.sender?.image ?? null,
    type: row.type,
    content: decryptRow(row),
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

export const MessageService = {
  async getConversations(userId: string): Promise<ConversationDTO[]> {
    const rows = await messageRepository.getConversationsForUser(userId);
    return rows.map((conv) => ({
      id: conv.id,
      subject: conv.subject,
      isLocked: conv.isLocked,
      participants: conv.participants,
      lastMessage: conv.lastMessage
        ? {
            content: conv.lastMessage.type === "SYSTEM" ? conv.lastMessage.content : decryptRow(conv.lastMessage as RawMessage),
            createdAt: conv.lastMessage.createdAt.toISOString(),
            senderId: conv.lastMessage.senderId,
          }
        : null,
      unreadCount: 0,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  },

  async getMessages(
    conversationId: string,
    userId: string,
    isAdmin = false,
  ): Promise<{ messages: MessageDTO[]; viewedAsAdmin: boolean } | null> {
    const participant = await messageRepository.isParticipant(conversationId, userId);
    if (!participant && !isAdmin) return null;

    const rows = await messageRepository.getMessagesRaw(conversationId);
    if (participant) {
      await messageRepository.markDelivered(conversationId, userId);
    }
    return { messages: rows.map(toDTO), viewedAsAdmin: !participant && isAdmin };
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    input: { content?: string; replyToId?: string; attachments?: Parameters<typeof messageRepository.sendMessage>[0]["attachments"] },
  ): Promise<{ ok: true; message: MessageDTO } | { ok: false; reason: "MUTED" }> {
    const status = await moderationRepository.getAccountStatus(senderId);
    const isMuted =
      status?.accountStatus === "MUTED" &&
      (!status.accountStatusExpiresAt || status.accountStatusExpiresAt.getTime() > Date.now());
    if (isMuted) return { ok: false, reason: "MUTED" };

    const encrypted = input.content ? encryptMessageContent(input.content) : undefined;

    const row = await messageRepository.sendMessage({
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

    const dto = toDTO(row);
    const otherIds = await messageRepository.getOtherParticipantIds(conversationId, senderId);
    await RealtimeService.publishToUsers(otherIds, "new_message", dto);
    return { ok: true, message: dto };
  },

  async createSystemMessage(conversationId: string, content: string, metadata?: any): Promise<MessageDTO> {
    const row = await messageRepository.sendMessage({ conversationId, senderId: null, type: "SYSTEM", content, metadata });
    const dto = toDTO(row);
    const allIds = await messageRepository.getParticipantIds(conversationId);
    await RealtimeService.publishToUsers(allIds, "new_message", dto);
    return dto;
  },

  async editMessage(messageId: string, userId: string, content: string): Promise<
    { ok: true; message: MessageDTO } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "DELETED" }
  > {
    const existing = await messageRepository.findMessageById(messageId);
    if (!existing) return { ok: false, reason: "NOT_FOUND" };
    if (existing.senderId !== userId) return { ok: false, reason: "FORBIDDEN" };
    if (existing.deletedAt) return { ok: false, reason: "DELETED" };

    const encrypted = encryptMessageContent(content);
    const row = await messageRepository.editMessage(messageId, encrypted);
    const dto = toDTO(row);
    const otherIds = await messageRepository.getOtherParticipantIds(row.conversationId, userId);
    await RealtimeService.publishToUsers(otherIds, "message_edited", dto);
    return { ok: true, message: dto };
  },

  async deleteOwnMessage(messageId: string, userId: string): Promise<
    { ok: true; message: MessageDTO } | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" }
  > {
    const existing = await messageRepository.findMessageById(messageId);
    if (!existing) return { ok: false, reason: "NOT_FOUND" };
    if (existing.senderId !== userId) return { ok: false, reason: "FORBIDDEN" };

    const row = await messageRepository.deleteMessage(messageId, userId);
    const dto = toDTO(row);
    const otherIds = await messageRepository.getOtherParticipantIds(row.conversationId, userId);
    await RealtimeService.publishToUsers(otherIds, "message_deleted", dto);
    return { ok: true, message: dto };
  },

  async markRead(conversationId: string, userId: string, upToMessageId: string): Promise<void> {
    const senderIds = await messageRepository.markRead(conversationId, userId, upToMessageId);
    await RealtimeService.publishToUsers(senderIds, "message_read", { conversationId, userId, upToMessageId });
  },

  async setTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    await RealtimeService.publishTyping(conversationId, userId, isTyping);
    const otherIds = await messageRepository.getOtherParticipantIds(conversationId, userId);
    await RealtimeService.publishToUsers(otherIds, "typing", { conversationId, userId, isTyping });
  },

  async getOrCreateConversation(userId: string, otherUserId: string, subject?: string) {
    const existing = await messageRepository.findConversationByParticipants([userId, otherUserId]);
    if (existing) return existing;

    return messageRepository.createConversation([userId, otherUserId], subject);
  },

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    const message = await messageRepository.findMessageById(messageId);
    if (!message) return { ok: false, reason: "NOT_FOUND" };
    
    await messageRepository.addReaction(messageId, userId, emoji);
    const otherIds = await messageRepository.getOtherParticipantIds(message.conversationId, userId);
    await RealtimeService.publishToUsers(otherIds, "reaction_added", { messageId, userId, emoji });
    return { ok: true };
  },

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const message = await messageRepository.findMessageById(messageId);
    if (!message) return { ok: false, reason: "NOT_FOUND" };
    
    await messageRepository.removeReaction(messageId, userId, emoji);
    const otherIds = await messageRepository.getOtherParticipantIds(message.conversationId, userId);
    await RealtimeService.publishToUsers(otherIds, "reaction_removed", { messageId, userId, emoji });
    return { ok: true };
  },
};
