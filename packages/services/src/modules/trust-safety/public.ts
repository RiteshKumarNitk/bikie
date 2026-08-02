import { createAuditApplication } from "./application/audit.application";
import { createModerationApplication } from "./application/moderation.application";
import { createReportApplication } from "./application/report.application";
import {
  createAuditLogAdapter,
  createModerationMessageAdapter,
  createModerationRepositoryAdapter,
  createReportRepositoryAdapter,
  createTrustNotificationAdapter,
  createTrustRealtimeAdapter,
} from "./infrastructure/adapters";
import type { TrustSafetyPorts } from "./ports";

export type TrustSafetyModule = {
  ports: TrustSafetyPorts;
  reports: ReturnType<typeof createReportApplication>;
  moderation: ReturnType<typeof createModerationApplication>;
  audit: ReturnType<typeof createAuditApplication>;
};

export type TrustSafetyDeps = Partial<TrustSafetyPorts>;

export function createTrustSafetyModule(overrides: TrustSafetyDeps = {}): TrustSafetyModule {
  const ports: TrustSafetyPorts = {
    reports: overrides.reports ?? createReportRepositoryAdapter(),
    moderation: overrides.moderation ?? createModerationRepositoryAdapter(),
    messages: overrides.messages ?? createModerationMessageAdapter(),
    notifications: overrides.notifications ?? createTrustNotificationAdapter(),
    realtime: overrides.realtime ?? createTrustRealtimeAdapter(),
    audit: overrides.audit ?? createAuditLogAdapter(),
  };

  return {
    ports,
    reports: createReportApplication(ports),
    moderation: createModerationApplication(ports),
    audit: createAuditApplication(ports),
  };
}

let defaultModule: TrustSafetyModule | null = null;

export function getTrustSafetyModule(): TrustSafetyModule {
  if (!defaultModule) defaultModule = createTrustSafetyModule();
  return defaultModule;
}

export function setTrustSafetyModuleForTests(module: TrustSafetyModule | null): void {
  defaultModule = module;
}

export type { TrustSafetyPorts } from "./ports";
export {
  moderationExpiresAt,
  isReportStatus,
  REPORT_STATUSES,
} from "./domain/moderation";
export type {
  AccountModerationStatus,
  ModerationActionType,
  ReportStatus,
} from "./domain/moderation";
