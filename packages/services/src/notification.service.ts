import { notificationRepository } from "@bikie/database";
import type { NotificationDTO, NotificationType } from "@bikie/types";
import { RealtimeService } from "./lib/realtime";

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
