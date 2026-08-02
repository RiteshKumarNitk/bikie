import { NotificationService } from "../../../notification.service";
import type { InAppNotificationPort } from "../ports";

/** Adapter to existing NotificationService — keeps SOS fan-out free of notification internals. */
export function createInAppNotificationAdapter(): InAppNotificationPort {
  return {
    notify(userId, type, title, body, entity, entityId) {
      return NotificationService.notify(userId, type, title, body, entity, entityId);
    },
  };
}
