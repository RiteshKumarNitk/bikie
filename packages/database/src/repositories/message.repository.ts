import { prisma } from "../client";

export async function getConversationsForUser(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  return participations.map((p) => {
    const conv = p.conversation;
    const lastMsg = conv.messages[0] ?? null;
    return {
      id: conv.id,
      subject: conv.subject,
      participants: conv.participants.map((pp) => pp.user),
      lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt.toISOString(), senderId: lastMsg.senderId } : null,
      unreadCount: 0,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    };
  });
}

export async function getMessages(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) return null;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  return messages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.sender.name,
    content: m.content,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!participant) throw new Error("Not a participant in this conversation");

  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
    include: { sender: { select: { id: true, name: true } } },
  });

  await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: message.sender.name,
    content: message.content,
    readAt: null,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function createConversation(participantIds: string[], subject?: string) {
  const conversation = await prisma.conversation.create({
    data: {
      subject,
      participants: {
        create: participantIds.map((userId) => ({ userId })),
      },
    },
  });
  return conversation;
}

export async function addParticipant(conversationId: string, userId: string) {
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    create: { conversationId, userId },
    update: {},
  });
}

export async function findConversationByParticipants(participantIds: string[]) {
  const sortedIds = [...participantIds].sort();
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        every: { userId: { in: participantIds } },
      },
    },
    include: { participants: true },
  });

  const match = conversations.find((c) => {
    const ids = c.participants.map((p) => p.userId).sort();
    return ids.length === sortedIds.length && ids.every((id, i) => id === sortedIds[i]);
  });

  return match ?? null;
}