import { notificationRepository } from "@bikie/database";
import type { NotificationDTO, NotificationType } from "@bikie/types";
import { RealtimeService } from "./lib/realtime";
import { PushService } from "./push.service";

function toDTO(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  entity: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    entity: row.entity,
    entityId: row.entityId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const NotificationService = {
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    entity?: string,
    entityId?: string,
  ): Promise<void> {
    const row = await notificationRepository.create({ userId, type, title, body, entity, entityId });
    await RealtimeService.publishToUser(userId, "notification", toDTO(row));
    // Fire-and-forget: push delivery must never block or fail the in-app notification write
    // above, which is the source of truth. Covers every notification type (bookings, trip
    // requests, chat, moderation, SOS) since they all funnel through this one function.
    PushService.sendToUser(userId, { title, body, data: { type, entity: entity ?? "", entityId: entityId ?? "" } }).catch(
      console.error,
    );
  },

  async notifyMany(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    entity?: string,
    entityId?: string,
  ): Promise<void> {
    await Promise.all(userIds.map((userId) => NotificationService.notify(userId, type, title, body, entity, entityId)));
  },

  async listForUser(userId: string): Promise<NotificationDTO[]> {
    const rows = await notificationRepository.findForUser(userId);
    return rows.map(toDTO);
  },

  async markRead(userId: string, notificationId: string): Promise<void> {
    await notificationRepository.markRead(userId, notificationId);
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },
};
