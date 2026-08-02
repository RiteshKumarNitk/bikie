import { getMessagingModule } from "./modules/messaging/public";
import type { ConversationDTO, MessageDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing MessageService. */
export const MessageService = {
  getConversations(userId: string): Promise<ConversationDTO[]> {
    return getMessagingModule().messages.getConversations(userId);
  },

  getMessages(conversationId: string, userId: string, isAdmin = false) {
    return getMessagingModule().messages.getMessages(conversationId, userId, isAdmin);
  },

  sendMessage(
    conversationId: string,
    senderId: string,
    input: { content?: string; replyToId?: string; attachments?: unknown },
  ) {
    return getMessagingModule().messages.sendMessage(conversationId, senderId, input as never);
  },

  createSystemMessage(conversationId: string, content: string, metadata?: unknown): Promise<MessageDTO> {
    return getMessagingModule().messages.createSystemMessage(conversationId, content, metadata);
  },

  editMessage(messageId: string, userId: string, content: string) {
    return getMessagingModule().messages.editMessage(messageId, userId, content);
  },

  deleteOwnMessage(messageId: string, userId: string) {
    return getMessagingModule().messages.deleteOwnMessage(messageId, userId);
  },

  markRead(conversationId: string, userId: string, upToMessageId: string) {
    return getMessagingModule().messages.markRead(conversationId, userId, upToMessageId);
  },

  setTyping(conversationId: string, userId: string, isTyping: boolean) {
    return getMessagingModule().messages.setTyping(conversationId, userId, isTyping);
  },

  getOrCreateConversation(userId: string, otherUserId: string, subject?: string) {
    return getMessagingModule().messages.getOrCreateConversation(userId, otherUserId, subject);
  },

  reactToMessage(messageId: string, userId: string, emoji: string) {
    return getMessagingModule().messages.reactToMessage(messageId, userId, emoji);
  },

  removeReaction(messageId: string, userId: string, emoji: string) {
    return getMessagingModule().messages.removeReaction(messageId, userId, emoji);
  },
};
