export type NotificationType =
  | "RIDE_REQUEST_RECEIVED"
  | "RIDE_REQUEST_APPROVED"
  | "RIDE_REQUEST_REJECTED"
  | "RIDE_ANNOUNCEMENT"
  | "TRIP_CANCELLED"
  | "TRIP_RESCHEDULED"
  | "NEW_MESSAGE"
  | "GROUP_JOIN_APPROVED"
  | "MODERATION_ACTION"
  | "SOS_ALERT"
  | "SYSTEM"
  // --- ADR-046b: Service Provider application/verification decisions ---
  | "PARTNER_APPLICATION_APPROVED"
  | "PARTNER_APPLICATION_REJECTED"
  | "PARTNER_APPLICATION_INFO_REQUESTED"
  | "PARTNER_APPLICATION_SUSPENDED";

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
