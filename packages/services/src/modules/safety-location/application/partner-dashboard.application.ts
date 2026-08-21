import type {
  PartnerActiveSessionDTO,
  PartnerHistorySessionDTO,
  PartnerNearbyRequestDTO,
  PartnerPendingOfferDTO,
  PartnerSosDashboardDTO,
} from "@bikie/types";
import { haversineDistanceMeters } from "../domain/eta";
import { partnerMatchesAlertType } from "../domain/partner-mapping";
import { deriveSeverity } from "../domain/severity";
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
   * admin-SUSPENDED partners get an empty list, not an error, since this also backs the
   * dashboard's best-effort "activeRequests" count. Verification is deliberately NOT a filter
   * (FINAL PRODUCT MODEL): unverified providers operate the platform and can accept assistance
   * requests; only a SUSPENDED profile loses the capability.
   *
   * Severity-filtered the same way `resolveServiceProviders` (escalation.application.ts) gates
   * automatic dispatch: a RED/EMERGENCY alert never reaches Service Providers, whether by
   * notification or by browsing here — was previously missing on this path specifically, so a
   * RED alert could still be *browsed* into even though it was never auto-dispatched to them. */
  async function listNearbyOpenRequests(
    userId: string,
    location: { latitude: number; longitude: number },
  ): Promise<PartnerNearbyRequestDTO[]> {
    const partner = await ports.partnerDispatch.getEligibilityFields(userId);
    if (!partner || partner.verificationStatus === "SUSPENDED" || !partner.isAvailable) return [];

    const open = await ports.sosAlerts.getOpenAlertsNearPoint(
      location.latitude,
      location.longitude,
      SOS_PARTNER_ELIGIBILITY_RADIUS_METERS,
    );
    const typeMatched = open.filter(
      (a) => deriveSeverity(a.type) !== "EMERGENCY" && partnerMatchesAlertType(partner, a.type),
    );

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

  /** A partner's own outstanding offers — made, but not yet accepted/rejected/withdrawn/expired,
   * on an alert still open. Without this list, an offer disappears from "Nearby Requests" the
   * instant it's made (by design, see `listNearbyOpenRequests`) and never appears in "Active
   * Assistance" unless the rider accepts it — leaving the partner with no way to see it's still
   * pending anywhere in the app once they navigate away from that alert's own detail screen. */
  async function listPendingOffers(userId: string): Promise<PartnerPendingOfferDTO[]> {
    const offers = await ports.sosOffers.listPendingOffersForResponder(userId);
    return offers.map((o) => ({
      offerId: o.offerId,
      alertId: o.alertId,
      alertType: o.alertType,
      severity: o.severity,
      city: o.city,
      distanceMeters: o.distanceMeters,
      etaMinutes: o.etaMinutes,
      createdAt: o.createdAt.toISOString(),
    }));
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

  return { getDashboard, listNearbyOpenRequests, listPendingOffers, listActiveAssistance, listHistory };
}

export type PartnerDashboardApplication = ReturnType<typeof createPartnerDashboardApplication>;
