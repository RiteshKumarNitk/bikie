export interface ConversationDTO {
  id: string;
  subject: string | null;
  participants: { id: string; name: string; email: string; role: string }[];
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}