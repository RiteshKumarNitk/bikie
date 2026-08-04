import { prisma } from "../client";

export async function record(params: {
  alertId: string;
  sessionId?: string;
  type: string;
  actorId?: string;
  metadata?: unknown;
}) {
  await prisma.sOSTimelineEvent.create({
    data: {
      alertId: params.alertId,
      sessionId: params.sessionId,
      type: params.type as any,
      actorId: params.actorId,
      metadata: params.metadata as any,
    },
  });
}

export async function listForAlert(alertId: string) {
  return prisma.sOSTimelineEvent.findMany({
    where: { alertId },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { id: true, name: true } } },
  });
}
