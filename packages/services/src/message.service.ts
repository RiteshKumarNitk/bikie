import { messageRepository } from "@bikie/database";
import type { ConversationDTO, MessageDTO } from "@bikie/types";

export const MessageService = {
  async getConversations(userId: string): Promise<ConversationDTO[]> {
    return messageRepository.getConversationsForUser(userId);
  },

  async getMessages(conversationId: string, userId: string): Promise<MessageDTO[] | null> {
    return messageRepository.getMessages(conversationId, userId);
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<MessageDTO> {
    return messageRepository.sendMessage(conversationId, senderId, content);
  },

  async getOrCreateConversation(userId: string, otherUserId: string, subject?: string) {
    const existing = await messageRepository.findConversationByParticipants([userId, otherUserId]);
    if (existing) return existing;

    return messageRepository.createConversation([userId, otherUserId], subject);
  },
};