export interface ConversationDTO {
  id: string;
  subject: string | null;
  isLocked: boolean;
  // Deliberately no `email` here — this DTO backs ordinary 1:1/group chats
  // (GET /api/conversations) and shouldn't leak a participant's email to the
  // other side of the conversation. SOSAlertDTO (packages/types/src/sos.ts) is
  // the separate, intentional case that carries full reporter contact info.
  participants: { id: string; name: string; role: string }[];
  lastMessage: { content: string | null; createdAt: string; senderId: string | null } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachmentDTO {
  id: string;
  type: "IMAGE" | "DOCUMENT";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export interface MessageReceiptDTO {
  userId: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface MessageReactionDTO {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
  senderImage: string | null;
  type: "TEXT" | "SYSTEM";
  content: string | null;
  metadata: any | null;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  attachments: MessageAttachmentDTO[];
  receipts: MessageReceiptDTO[];
  reactions: MessageReactionDTO[];
  createdAt: string;
}
