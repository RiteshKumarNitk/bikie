import { prisma } from "../client";
import { haversineDistanceMeters } from "../lib/geo";

const ALERT_USER_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      riderProfile: { select: { vehicleType: true, vehicleBrand: true, vehicleModel: true } },
    },
  },
} as const;

function toDTO(alert: {
  id: string;
  userId: string;
  user: {
    name: string;
    phone: string | null;
    email: string;
    riderProfile: { vehicleType: string | null; vehicleBrand: string | null; vehicleModel: string | null } | null;
  };
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
  placeName: string | null;
  area: string | null;
  formattedAddress: string | null;
}, distanceMeters?: number) {
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
    placeName: alert.placeName,
    area: alert.area,
    formattedAddress: alert.formattedAddress,
    // ADR-044 — most riders never fill this in, hence the fallback to null throughout.
    riderVehicleType: alert.user.riderProfile?.vehicleType ?? null,
    riderVehicleBrand: alert.user.riderProfile?.vehicleBrand ?? null,
    riderVehicleModel: alert.user.riderProfile?.vehicleModel ?? null,
    // ADR-045 — only set when the caller supplied viewer coordinates (getActiveAlerts' location
    // filter already computes this for radius filtering; previously discarded before returning).
    ...(distanceMeters !== undefined ? { distanceMeters: Math.round(distanceMeters) } : {}),
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
  placeName?: string | null;
  area?: string | null;
  formattedAddress?: string | null;
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
      placeName: data.placeName ?? null,
      area: data.area ?? null,
      formattedAddress: data.formattedAddress ?? null,
    },
    include: ALERT_USER_INCLUDE,
  });
  return toDTO(alert);
}

/**
 * Which active alerts a rider gets to see. Used to be an exact, case-sensitive match on a
 * freely-typed `city` string — the sender's city at alert creation and the viewer's city via
 * "Set city" had nothing forcing them to agree on spelling/casing, so "Jaipur" vs "jaipur"
 * silently hid otherwise-nearby alerts with no error anywhere to explain why. Replaced with a
 * plain in-app Haversine radius around the viewer's own GPS fix — the same approach already used
 * for `/api/partners/nearby` (ADR-036) and consistent with how SOS *dispatch* already finds
 * nearby riders to notify (`findNearbyAroundPoint`, real PostGIS). `city` itself is untouched —
 * still stored and still used for display text everywhere (SMS/WhatsApp/email, dispatch
 * summaries) — this only changes how the *browse* list is filtered.
 *
 * No `location` (ADMIN only, enforced by the route) returns every active alert network-wide,
 * unfiltered — matches the existing "admins monitor the whole network" behavior.
 */
export async function getActiveAlerts(location?: { latitude: number; longitude: number; radiusMeters: number }) {
  const alerts = await prisma.sOSAlert.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: ALERT_USER_INCLUDE,
  });

  if (!location) return alerts.map(toDTO);

  return alerts
    .map((alert) => ({
      alert,
      distanceMeters: haversineDistanceMeters(location.latitude, location.longitude, alert.latitude, alert.longitude),
    }))
    .filter((a) => a.distanceMeters <= location.radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .map((a) => toDTO(a.alert, a.distanceMeters));
}

export async function getAlertById(alertId: string) {
  const alert = await prisma.sOSAlert.findUnique({
    where: { id: alertId },
    include: ALERT_USER_INCLUDE,
  });
  if (!alert) return null;
  return toDTO(alert);
}

/** ADR-044 — open (unassigned, ACTIVE) alerts within a radius, for a partner's own "Nearby
 * Requests" list. See getActiveAlerts's doc comment for why this is a separate query rather
 * than an extra filter param on it: that one intentionally still shows already-assigned alerts
 * to riders/admins browsing. */
export async function getOpenAlertsNearPoint(latitude: number, longitude: number, radiusMeters: number) {
  const alerts = await prisma.sOSAlert.findMany({
    where: { status: "ACTIVE", assignedHelperId: null },
    orderBy: { createdAt: "desc" },
    include: ALERT_USER_INCLUDE,
  });

  return alerts
    .map((alert) => ({
      alert,
      distanceMeters: haversineDistanceMeters(latitude, longitude, alert.latitude, alert.longitude),
    }))
    .filter((a) => a.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .map((a) => toDTO(a.alert));
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
