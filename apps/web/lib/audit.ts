import { AuditService } from "@bikie/services";
import { headers } from "next/headers";

/** HTTP-edge helper: attaches client IP then delegates to AuditService. */
export async function logAdminAction(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const reqHeaders = await headers();
  return AuditService.logAdminAction({
    ...params,
    ipAddress: reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? undefined,
  });
}
