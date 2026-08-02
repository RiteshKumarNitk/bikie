import { messageRepository, moderationRepository } from "@bikie/database";
import { decryptMessageContent, encryptMessageContent } from "../../../lib/message-crypto";
import { RealtimeService } from "../../../lib/realtime";
import type {
  AccountStatusPort,
  MessageCryptoPort,
  MessageStorePort,
  MessagingRealtimePort,
} from "../ports";

export function createMessageStoreAdapter(): MessageStorePort {
  return messageRepository as unknown as MessageStorePort;
}

export function createMessageCryptoAdapter(): MessageCryptoPort {
  return {
    encrypt: (plaintext) => encryptMessageContent(plaintext),
    decrypt: (payload) => decryptMessageContent(payload),
  };
}

export function createMessagingRealtimeAdapter(): MessagingRealtimePort {
  return {
    publishToUsers: (userIds, event, payload) => RealtimeService.publishToUsers(userIds, event, payload),
    publishTyping: (conversationId, userId, isTyping) =>
      RealtimeService.publishTyping(conversationId, userId, isTyping),
  };
}

export function createAccountStatusAdapter(): AccountStatusPort {
  return {
    getAccountStatus: (userId) => moderationRepository.getAccountStatus(userId),
  };
}
