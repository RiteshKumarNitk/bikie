import { prisma } from "../client";

export async function createAlert(data: {
  userId: string;
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
}) {
  const alert = await prisma.sOSAlert.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
    },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
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
    resolvedAt: null,
    createdAt: alert.createdAt.toISOString(),
  };
}

export async function getActiveAlerts(city?: string) {
  const where: any = { status: "ACTIVE" };
  if (city) where.city = city;

  const alerts = await prisma.sOSAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });

  return alerts.map((a) => ({
    id: a.id,
    userId: a.userId,
    userName: a.user.name,
    userPhone: a.user.phone,
    userEmail: a.user.email,
    type: a.type,
    description: a.description,
    latitude: a.latitude,
    longitude: a.longitude,
    city: a.city,
    status: a.status,
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function resolveAlert(alertId: string, userId: string) {
  await prisma.sOSAlert.update({
    where: { id: alertId },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: userId },
  });
}

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
  await prisma.sOSAlert.updateMany({
    where: { status: "ACTIVE", createdAt: { lte: cutoff } },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}