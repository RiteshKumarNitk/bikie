import type { ModerationConversationSummaryDTO, ReportDTO } from "@bikie/types";
import type { AccountModerationStatus, ModerationActionType, ReportStatus } from "../domain/moderation";

export type ReportCreateInput = {
  targetType: "MESSAGE" | "USER" | "TRIP" | "CONVERSATION" | "GROUP";
  targetId: string;
  reason: "SPAM" | "ABUSE" | "FAKE_ACCOUNT" | "DANGEROUS_BEHAVIOUR" | "HARASSMENT" | "SCAM" | "OTHER";
  details?: string;
};

export interface ReportRepositoryPort {
  create(data: ReportCreateInput & { reporterId: string }): Promise<{ id: string }>;
  findById(id: string): Promise<{ id: string } | null>;
  findByIdWithRelations(id: string): Promise<unknown | null>;
  findMany(filters: { status?: string; targetType?: string }): Promise<unknown[]>;
  updateStatus(
    reportId: string,
    status: ReportStatus,
    adminId: string,
    resolutionNote?: string,
  ): Promise<{ id: string }>;
}

export interface ModerationRepositoryPort {
  listConversationsForModeration(page: number): Promise<{
    conversations: Array<{
      id: string;
      subject: string | null;
      isLocked: boolean;
      trip: { title: string } | null;
      _count: { messages: number };
      participants: Array<{ user: { id: string; name: string; email: string } }>;
      updatedAt: Date;
    }>;
    total: number;
  }>;
  createAction(data: {
    targetUserId?: string;
    adminId: string;
    type: ModerationActionType;
    reason: string;
    reportId?: string;
    relatedEntity?: string;
    relatedEntityId?: string;
    expiresAt?: Date | null;
  }): Promise<unknown>;
  lockConversation(conversationId: string, adminId: string, locked: boolean): Promise<unknown>;
  deleteConversation(conversationId: string): Promise<unknown>;
  setAccountStatus(
    userId: string,
    status: AccountModerationStatus,
    expiresAt: Date | null,
  ): Promise<unknown>;
}

export interface ModerationMessagePort {
  findMessageById(messageId: string): Promise<{ id: string; conversationId: string } | null>;
  deleteMessage(messageId: string, actorId: string): Promise<unknown>;
  getOtherParticipantIds(conversationId: string, excludeUserId: string): Promise<string[]>;
  /** §34 — fetch raw (encrypted) messages for admin moderation review; requires a reason. */
  getMessagesRaw(conversationId: string, take?: number): Promise<any[]>;
}

export interface TrustNotificationPort {
  notify(userId: string, type: string, title: string, body: string): Promise<void>;
}

export interface TrustRealtimePort {
  publishToAdmins(event: string, payload: unknown): Promise<void>;
  publishToUsers(userIds: string[], event: string, payload: unknown): Promise<void>;
  publishToUser(userId: string, event: string, payload: unknown): Promise<void>;
}

export interface AuditLogPort {
  log(params: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<unknown>;
}

export interface TrustSafetyPorts {
  reports: ReportRepositoryPort;
  moderation: ModerationRepositoryPort;
  messages: ModerationMessagePort;
  notifications: TrustNotificationPort;
  realtime: TrustRealtimePort;
  audit: AuditLogPort;
}

export type { ReportDTO, ModerationConversationSummaryDTO };
