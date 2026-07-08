import { prisma } from "../client";

export async function log(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({ data: params as any });
}

export async function findLogs(options?: { limit?: number; entity?: string }) {
  const where: any = {};
  if (options?.entity) where.entity = options.entity;

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
}