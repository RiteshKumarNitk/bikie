/** Timed moderation actions store an absolute expiry computed from duration hours. */
export function moderationExpiresAt(durationHours: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + durationHours * 60 * 60 * 1000);
}

export type AccountModerationStatus = "ACTIVE" | "MUTED" | "SUSPENDED" | "BANNED";

export type ModerationActionType =
  | "WARN"
  | "MUTE"
  | "SUSPEND"
  | "BAN"
  | "UNBAN"
  | "DELETE_MESSAGE"
  | "CLOSE_RIDE_ROOM"
  | "DELETE_RIDE_ROOM";

export const REPORT_STATUSES = ["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportStatus(value: string): value is ReportStatus {
  return (REPORT_STATUSES as readonly string[]).includes(value);
}
