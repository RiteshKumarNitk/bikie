import { auditRepository } from "@bikie/database";
import { headers } from "next/headers";

export async function logAdminAction(params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const reqHeaders = await headers();
  return auditRepository.log({
    ...params,
    ipAddress: reqHeaders.get("x-forwarded-for") ?? reqHeaders.get("x-real-ip") ?? undefined,
  });
}