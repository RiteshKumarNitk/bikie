import type { PartnerActiveSessionDTO, PartnerHistorySessionDTO, PartnerNearbyRequestDTO, PartnerSosDashboardDTO } from "@bikie/types";
import { haversineDistanceMeters } from "../domain/eta";
import { partnerMatchesAlertType } from "../domain/partner-mapping";
import { getReputationModule, type ReputationApplication } from "../../reputation/public";
import type { SafetyLocationPorts } from "../ports";

/** Same fixed radius `resolveServiceProviders` (escalation.application.ts) uses for dispatch —
 * one "nearby" meaning, whether a partner is being paged automatically or browsing on their own. */
const SOS_PARTNER_ELIGIBILITY_RADIUS_METERS = 25_000;

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export type PartnerDashboardApplicationDeps = { reputation?: ReputationApplication };

/**
 * The partner-facing SOS "Emergency Assistance Dashboard" read model (ADR-044) — kept separate
 * from session.application.ts, which owns the offer/session *lifecycle*; this is purely a set
 * of read queries composing data that already exists elsewhere (reputation counters, open
 * alerts, active sessions), not new state.
 */
export function createPartnerDashboardApplication(
  ports: SafetyLocationPorts,
  deps: PartnerDashboardApplicationDeps = {},
) {
  const reputation = deps.reputation ?? getReputationModule().reputation;

  /** A partner only ever sees requests they're actually eligible to respond to — offline or
   * unverified partners get an empty list, not an error, since this also backs the dashboard's
   * best-effort "activeRequests" count. */
  async function listNearbyOpenRequests(
    userId: string,
    location: { latitude: number; longitude: number },
  ): Promise<PartnerNearbyRequestDTO[]> {
    const partner = await ports.partnerDispatch.getEligibilityFields(userId);
    if (!partner?.isVerified || !partner.isAvailable) return [];

    const open = await ports.sosAlerts.getOpenAlertsNearPoint(
      location.latitude,
      location.longitude,
      SOS_PARTNER_ELIGIBILITY_RADIUS_METERS,
    );
    const typeMatched = open.filter((a) => partnerMatchesAlertType(partner, a.type));

    // ADR-045 — an alert this partner already offered on or declined shouldn't keep reappearing
    // as if it were new; declining in particular would otherwise have no visible effect at all.
    const responded = await ports.sosOffers.findRespondedAlertIds(userId, typeMatched.map((a) => a.id));

    return typeMatched
      .filter((a) => !responded.has(a.id))
      .map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        city: a.city,
        distanceMeters: Math.round(haversineDistanceMeters(location.latitude, location.longitude, a.latitude, a.longitude)),
        createdAt: a.createdAt,
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async function listActiveAssistance(userId: string): Promise<PartnerActiveSessionDTO[]> {
    const sessions = await ports.sosSessions.listActiveSessionsForHelper(userId);
    return sessions.map((s) => ({
      id: s.sessionId,
      alertId: s.alertId,
      status: s.status,
      riderName: s.riderName,
      alertType: s.alertType,
      distanceMeters: s.distanceMeters,
      etaMinutes: s.etaMinutes,
    }));
  }

  /** `location` is optional — without it (no GPS fix captured yet), `activeRequests` reports 0
   * rather than failing the whole dashboard; every other stat is location-independent. */
  async function getDashboard(
    userId: string,
    location?: { latitude: number; longitude: number },
  ): Promise<PartnerSosDashboardDTO> {
    const [stats, todayAssistanceCount, nearby] = await Promise.all([
      reputation.getStats(userId),
      ports.sosSessions.countSessionsForHelperSince(userId, startOfTodayUtc()),
      location ? listNearbyOpenRequests(userId, location) : Promise.resolve([]),
    ]);

    return {
      activeRequests: nearby.length,
      todayAssistanceCount,
      completedCount: stats?.emergencyResponseCount ?? 0,
      ratingAvg: stats?.helperRatingAvg ?? 0,
      ratingCount: stats?.helperRatingCount ?? 0,
    };
  }

  /** ADR-046b — "Completed Assistance"/"Assistance History". */
  async function listHistory(userId: string): Promise<PartnerHistorySessionDTO[]> {
    const sessions = await ports.sosSessions.listHistorySessionsForHelper(userId);
    return sessions.map((s) => ({
      id: s.sessionId,
      alertId: s.alertId,
      status: s.status,
      riderName: s.riderName,
      alertType: s.alertType,
      completedAt: s.completedAt?.toISOString() ?? null,
      cancelledAt: s.cancelledAt?.toISOString() ?? null,
      rating: s.rating,
    }));
  }

  return { getDashboard, listNearbyOpenRequests, listActiveAssistance, listHistory };
}

export type PartnerDashboardApplication = ReturnType<typeof createPartnerDashboardApplication>;
