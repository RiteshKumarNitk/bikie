export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
};

export interface MessageCryptoPort {
  encrypt(plaintext: string): EncryptedPayload;
  decrypt(payload: EncryptedPayload): string;
}

export interface MessagingRealtimePort {
  publishToUsers(userIds: string[], event: string, payload: unknown): Promise<void>;
  publishTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void>;
}

export interface AccountStatusPort {
  getAccountStatus(userId: string): Promise<{
    accountStatus: string | null;
    accountStatusExpiresAt: Date | null;
  } | null>;
}

/** Thin pass-through of the existing message repository surface used by MessageService. */
export interface MessageStorePort {
  getConversationsForUser: typeof import("@bikie/database").messageRepository.getConversationsForUser;
  getMessagesRaw: typeof import("@bikie/database").messageRepository.getMessagesRaw;
  isParticipant: typeof import("@bikie/database").messageRepository.isParticipant;
  isConversationLocked: typeof import("@bikie/database").messageRepository.isConversationLocked;
  markDelivered: typeof import("@bikie/database").messageRepository.markDelivered;
  sendMessage: typeof import("@bikie/database").messageRepository.sendMessage;
  getOtherParticipantIds: typeof import("@bikie/database").messageRepository.getOtherParticipantIds;
  getParticipantIds: typeof import("@bikie/database").messageRepository.getParticipantIds;
  findMessageById: typeof import("@bikie/database").messageRepository.findMessageById;
  editMessage: typeof import("@bikie/database").messageRepository.editMessage;
  deleteMessage: typeof import("@bikie/database").messageRepository.deleteMessage;
  markRead: typeof import("@bikie/database").messageRepository.markRead;
  findConversationByParticipants: typeof import("@bikie/database").messageRepository.findConversationByParticipants;
  createConversation: typeof import("@bikie/database").messageRepository.createConversation;
  addReaction: typeof import("@bikie/database").messageRepository.addReaction;
  removeReaction: typeof import("@bikie/database").messageRepository.removeReaction;
}

export interface InAppNotificationPort {
  notifyMany(
    userIds: string[],
    type: "NEW_MESSAGE",
    title: string,
    body: string,
    entity?: string,
    entityId?: string,
  ): Promise<void>;
}

export interface MessagingPorts {
  store: MessageStorePort;
  crypto: MessageCryptoPort;
  realtime: MessagingRealtimePort;
  accountStatus: AccountStatusPort;
  notifications: InAppNotificationPort;
}
