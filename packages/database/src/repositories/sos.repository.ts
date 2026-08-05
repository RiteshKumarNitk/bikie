import { prisma } from "../client";

function toDTO(alert: {
  id: string;
  userId: string;
  user: { name: string; phone: string | null; email: string };
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  city: string;
  status: string;
  severity: string;
  escalationTier: string;
  currentRadiusMeters: number;
  assignedHelperId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: alert.id,
    userId: alert.userId,
    userName: alert.user.name,
    userPhone: alert.user.phone,
    userEmail: alert.user.email,
    type: alert.type,
    description: alert.description,
    latitude: alert.latitude,
    longitude: alert.longitude,
    city: alert.city,
    status: alert.status,
    severity: alert.severity,
    escalationTier: alert.escalationTier,
    currentRadiusMeters: alert.currentRadiusMeters,
    assignedHelperId: alert.assignedHelperId,
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
  };
}

export async function createAlert(data: {
  userId: string;
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
  severity: string;
  currentRadiusMeters: number;
  nextEscalationAt: Date | null;
}) {
  const alert = await prisma.sOSAlert.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      severity: data.severity as any,
      currentRadiusMeters: data.currentRadiusMeters,
      nextEscalationAt: data.nextEscalationAt,
    },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
  return toDTO(alert);
}

export async function getActiveAlerts(city?: string) {
  const where: any = { status: "ACTIVE" };
  if (city) where.city = city;

  const alerts = await prisma.sOSAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });

  return alerts.map(toDTO);
}

export async function getAlertById(alertId: string) {
  const alert = await prisma.sOSAlert.findUnique({
    where: { id: alertId },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
  if (!alert) return null;
  return toDTO(alert);
}

export async function resolveAlert(alertId: string, userId: string) {
  await prisma.sOSAlert.update({
    where: { id: alertId },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: userId, nextEscalationAt: null },
  });
}

/** Deprecated alias target — kept only for the old /respond route (ADR-028: no facade deletion
 * without zero-use proof). New callers should go through sos-session.repository.ts's createOffer. */
export async function respondToAlert(alertId: string, responderId: string, message?: string) {
  await prisma.sOSAlertResponse.create({
    data: { alertId, responderId, message },
  });
}

export async function getAlertHistory(userId: string) {
  const alerts = await prisma.sOSAlert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { responses: { include: { responder: { select: { id: true, name: true } } } } },
  });

  return alerts.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    city: a.city,
    status: a.status,
    severity: a.severity,
    escalationTier: a.escalationTier,
    assignedHelperId: a.assignedHelperId,
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    responses: a.responses.map((r) => ({
      id: r.id,
      responderName: r.responder.name,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  }));
}

export async function autoResolveStaleAlerts(minutes: number) {
  const cutoff = new Date(Date.now() - minutes * 60_000);
  return prisma.sOSAlert.findMany({
    where: { status: "ACTIVE", createdAt: { lte: cutoff } },
    select: { id: true, userId: true, assignedHelperId: true },
  });
}

export async function bulkResolve(alertIds: string[]) {
  if (alertIds.length === 0) return;
  await prisma.sOSAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { status: "RESOLVED", resolvedAt: new Date(), nextEscalationAt: null },
  });
}

/** Cron-poll query key for GET /api/cron/sos-escalate. */
export async function findAlertsDueForEscalation(before: Date, take = 50) {
  const alerts = await prisma.sOSAlert.findMany({
    where: { status: "ACTIVE", assignedHelperId: null, nextEscalationAt: { lte: before } },
    take,
  });
  return alerts;
}

export async function updateEscalationState(
  alertId: string,
  data: { escalationTier?: string; currentRadiusMeters?: number; nextEscalationAt: Date | null },
) {
  await prisma.sOSAlert.update({
    where: { id: alertId },
    data: {
      ...(data.escalationTier ? { escalationTier: data.escalationTier as any } : {}),
      ...(data.currentRadiusMeters !== undefined ? { currentRadiusMeters: data.currentRadiusMeters } : {}),
      nextEscalationAt: data.nextEscalationAt,
    },
  });
}

/** De-dup source for radius-expansion notifications — who's already been told about this
 * alert, so a wider radius only notifies the newly-in-range riders. Reuses the Notification
 * table every dispatch already writes to, instead of a new join table. */
export async function findNotifiedUserIdsForAlert(alertId: string): Promise<Set<string>> {
  const rows = await prisma.notification.findMany({
    where: { entity: "sos_alert", entityId: alertId },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}
