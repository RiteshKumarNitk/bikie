export interface ConversationDTO {
  id: string;
  subject: string | null;
  isLocked: boolean;
  participants: { id: string; name: string; email: string; role: string }[];
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

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
  type: "TEXT" | "SYSTEM";
  content: string | null;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  attachments: MessageAttachmentDTO[];
  receipts: MessageReceiptDTO[];
  createdAt: string;
}
