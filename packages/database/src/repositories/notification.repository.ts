import { prisma } from "../client";

type NotificationTypeValue =
  | "RIDE_REQUEST_RECEIVED"
  | "RIDE_REQUEST_APPROVED"
  | "RIDE_REQUEST_REJECTED"
  | "RIDE_ANNOUNCEMENT"
  | "NEW_MESSAGE"
  | "GROUP_JOIN_APPROVED"
  | "MODERATION_ACTION"
  | "SOS_ALERT"
  | "SYSTEM"
  // --- ADR-046b ---
  | "PARTNER_APPLICATION_APPROVED"
  | "PARTNER_APPLICATION_REJECTED"
  | "PARTNER_APPLICATION_INFO_REQUESTED"
  | "PARTNER_APPLICATION_SUSPENDED";

export async function create(params: {
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  entity?: string;
  entityId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      entity: params.entity,
      entityId: params.entityId,
    },
  });
}

export async function createMany(
  notifications: {
    userId: string;
    type: NotificationTypeValue;
    title: string;
    body: string;
    entity?: string;
    entityId?: string;
  }[],
) {
  if (notifications.length === 0) return;
  await prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      entity: n.entity,
      entityId: n.entityId,
    })),
  });
}

export async function findForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function markRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
