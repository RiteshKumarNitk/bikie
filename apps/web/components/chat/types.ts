export interface Conversation {
  id: string;
  subject: string | null;
  participants: { id: string; name: string; email: string; role: string; image?: string | null }[];
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}
