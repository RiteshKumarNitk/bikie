import { getTrustSafetyModule } from "./modules/trust-safety/public";

/** Compatibility facade — routes must not import the audit repository. */
export const AuditService = {
  async logAdminAction(params: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return getTrustSafetyModule().audit.logAdminAction(params);
  },
};
