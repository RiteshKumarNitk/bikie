import { prisma } from "../client";

export async function createAction(params: {
  targetUserId?: string;
  adminId: string;
  type:
    | "WARN"
    | "MUTE"
    | "SUSPEND"
    | "BAN"
    | "UNBAN"
    | "DELETE_MESSAGE"
    | "CLOSE_RIDE_ROOM"
    | "DELETE_RIDE_ROOM";
  reason: string;
  reportId?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
}) {
  return prisma.moderationAction.create({ data: params });
}

export async function setAccountStatus(
  userId: string,
  status: "ACTIVE" | "WARNED" | "MUTED" | "SUSPENDED" | "BANNED",
  expiresAt: Date | null,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { accountStatus: status, accountStatusExpiresAt: expiresAt },
  });
}

export async function getAccountStatus(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true, accountStatusExpiresAt: true },
  });
}

export async function listConversationsForModeration(page: number, pageSize = 25) {
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        trip: { select: { id: true, title: true, slug: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count(),
  ]);
  return { conversations, total, page, pageSize };
}

export async function lockConversation(conversationId: string, adminId: string, locked: boolean) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { isLocked: locked, lockedAt: locked ? new Date() : null, lockedById: locked ? adminId : null },
  });
}

export async function deleteConversation(conversationId: string) {
  await prisma.conversation.delete({ where: { id: conversationId } });
}
