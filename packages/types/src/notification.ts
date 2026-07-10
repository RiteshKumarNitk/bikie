export type NotificationType =
  | "RIDE_REQUEST_RECEIVED"
  | "RIDE_REQUEST_APPROVED"
  | "RIDE_REQUEST_REJECTED"
  | "RIDE_ANNOUNCEMENT"
  | "NEW_MESSAGE"
  | "GROUP_JOIN_APPROVED"
  | "MODERATION_ACTION"
  | "SOS_ALERT"
  | "SYSTEM";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entity: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}
