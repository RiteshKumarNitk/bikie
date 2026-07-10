export type ReportTargetType = "MESSAGE" | "USER" | "TRIP" | "CONVERSATION" | "GROUP";
export type ReportReason =
  | "SPAM"
  | "ABUSE"
  | "FAKE_ACCOUNT"
  | "DANGEROUS_BEHAVIOUR"
  | "HARASSMENT"
  | "SCAM"
  | "OTHER";
export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";

export interface ReportDTO {
  id: string;
  reporter: { id: string; name: string; email: string };
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  createdAt: string;
}

export type UserAccountStatus = "ACTIVE" | "WARNED" | "MUTED" | "SUSPENDED" | "BANNED";

export interface ModerationConversationSummaryDTO {
  id: string;
  subject: string | null;
  isLocked: boolean;
  tripTitle: string | null;
  messageCount: number;
  participants: { id: string; name: string; email: string }[];
  updatedAt: string;
}
