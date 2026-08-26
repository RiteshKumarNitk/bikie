import { prisma } from "../client";

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, image: true } },
  attachments: true,
  receipts: true,
  reactions: true,
} as const;

export async function getConversationsForUser(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          // No `email` — this backs ConversationDTO for ordinary 1:1/group chats, which
          // must not leak a participant's email (see packages/types/src/message.ts).
          participants: { include: { user: { select: { id: true, name: true, role: true } } } },
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
      isLocked: conv.isLocked,
      participants: conv.participants.map((pp) => pp.user),
      lastMessage: lastMsg,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    };
  });
}

export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return participant !== null;
}

/** `null` means the conversation doesn't exist — distinguished from `false` (exists, not locked)
 * so a caller can tell "nothing to send to" apart from "can't send here right now". */
export async function isConversationLocked(conversationId: string): Promise<boolean | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { isLocked: true },
  });
  return conversation?.isLocked ?? null;
}

/** Same underlying write `moderation.repository.ts`'s `lockConversation` uses for admin
 * moderation — duplicated here (rather than imported cross-repository) so rides-community's own
 * `ConversationLookupPort` adapter can lock a Ride Room on cancellation without depending on the
 * trust-safety module. `lockedById` is a generic "who locked it" attribution, not admin-only by
 * schema — a ride organizer cancelling their own ride is a legitimate value here. */
export async function setConversationLocked(conversationId: string, lockedById: string, locked: boolean): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { isLocked: locked, lockedAt: locked ? new Date() : null, lockedById: locked ? lockedById : null },
  });
}

export async function getMessagesRaw(conversationId: string, take = 200) {
  const limit = Math.min(Math.max(1, take), 500);
  // Newest-first fetch, then reverse so callers still receive chronological order.
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: MESSAGE_INCLUDE,
  });
  return rows.reverse();
}

export async function getOtherParticipantIds(conversationId: string, excludeUserId: string): Promise<string[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: excludeUserId } },
    select: { userId: true },
  });
  return participants.map((p) => p.userId);
}

export async function getParticipantIds(conversationId: string): Promise<string[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId);
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string | null;
  type: "TEXT" | "SYSTEM";
  content?: string;
  metadata?: any;
  ciphertext?: string;
  iv?: string;
  authTag?: string;
  encryptionVersion?: number;
  replyToId?: string;
  attachments?: {
    type: "IMAGE" | "DOCUMENT";
    url: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
  }[];
}) {
  const message = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      type: params.type,
      content: params.content,
      metadata: params.metadata ? (params.metadata as any) : undefined,
      ciphertext: params.ciphertext,
      iv: params.iv,
      authTag: params.authTag,
      encryptionVersion: params.encryptionVersion,
      replyToId: params.replyToId,
      attachments: params.attachments
        ? { create: params.attachments.map((a) => ({ ...a })) }
        : undefined,
    },
    include: MESSAGE_INCLUDE,
  });

  await prisma.conversation.update({ where: { id: params.conversationId }, data: { updatedAt: new Date() } });

  if (params.senderId) {
    const otherIds = await getOtherParticipantIds(params.conversationId, params.senderId);
    if (otherIds.length > 0) {
      await prisma.messageReceipt.createMany({
        data: otherIds.map((userId) => ({ messageId: message.id, userId })),
      });
    }
  }

  return message;
}

export async function editMessage(messageId: string, encrypted: {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
}) {
  return prisma.message.update({
    where: { id: messageId },
    data: { ...encrypted, editedAt: new Date() },
    include: MESSAGE_INCLUDE,
  });
}

export async function deleteMessage(messageId: string, deletedBy: string) {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      content: null,
      ciphertext: null,
      iv: null,
      authTag: null,
      deletedAt: new Date(),
      deletedBy,
    },
    include: MESSAGE_INCLUDE,
  });
}

export async function findMessageById(messageId: string) {
  return prisma.message.findUnique({ where: { id: messageId }, include: MESSAGE_INCLUDE });
}

export async function markDelivered(conversationId: string, userId: string) {
  await prisma.messageReceipt.updateMany({
    where: { userId, deliveredAt: null, message: { conversationId } },
    data: { deliveredAt: new Date() },
  });
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  return prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    create: { messageId, userId, emoji },
    update: {},
  });
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  return prisma.messageReaction.deleteMany({
    where: { messageId, userId, emoji },
  });
}

export async function markRead(conversationId: string, userId: string, upToMessageId: string) {
  const target = await prisma.message.findUnique({ where: { id: upToMessageId }, select: { createdAt: true } });
  if (!target) return [];

  const toUpdate = await prisma.messageReceipt.findMany({
    where: {
      userId,
      readAt: null,
      message: { conversationId, createdAt: { lte: target.createdAt } },
    },
    select: { id: true, message: { select: { senderId: true } } },
  });

  if (toUpdate.length === 0) return [];

  await prisma.messageReceipt.updateMany({
    where: { id: { in: toUpdate.map((r) => r.id) } },
    data: { readAt: new Date() },
  });

  return [...new Set(toUpdate.map((r) => r.message.senderId).filter((id): id is string => id !== null))];
}

export async function createConversation(
  participantIds: string[],
  subject?: string,
  organizerId?: string,
) {
  const conversation = await prisma.conversation.create({
    data: {
      subject,
      participants: {
        create: participantIds.map((userId) => ({
          userId,
          role: organizerId && userId === organizerId ? "ORGANIZER" : "MEMBER",
        })),
      },
    },
  });
  return conversation;
}

export async function addParticipant(conversationId: string, userId: string, role: "ORGANIZER" | "MEMBER" = "MEMBER") {
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    create: { conversationId, userId, role },
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

export async function getConversationById(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
}

export async function countUnread(userId: string) {
  return prisma.messageReceipt.count({
    where: {
      userId,
      readAt: null
    }
  });
}
