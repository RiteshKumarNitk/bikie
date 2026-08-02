import type { TrustSafetyPorts } from "../ports";

export function createAuditApplication(ports: TrustSafetyPorts) {
  return {
    logAdminAction(params: {
      userId: string;
      action: string;
      entity: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
    }) {
      return ports.audit.log(params);
    },
  };
}

export type AuditApplication = ReturnType<typeof createAuditApplication>;
