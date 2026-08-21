import { getSafetyLocationModule } from "./modules/safety-location/public";
import type { AlertViewer } from "./modules/safety-location/application/sos.application";
import type { RawSOSAlertDTO, SosLocationFilter } from "./modules/safety-location/ports";
import type { SOSAlertDTO, SOSAlertCreateInput } from "@bikie/types";

/** Compatibility facade — routes keep importing SOSService. */
export const SOSService = {
  /** Always the raw, non-redacted alert (fresh from creation) — the caller immediately hands
   * this to SOSDispatchService.fanOut, before any HTTP read/redaction boundary (ADR-045). */
  async createAlert(userId: string, data: SOSAlertCreateInput): Promise<RawSOSAlertDTO> {
    return getSafetyLocationModule().sos.createAlert(userId, data);
  },

  /** ADR-045 — `viewer` decides how much PII each returned alert carries; see pii-redaction.ts. */
  async getActiveAlerts(location: SosLocationFilter | undefined, viewer: AlertViewer): Promise<SOSAlertDTO[]> {
    return getSafetyLocationModule().sos.getActiveAlerts(location, viewer);
  },

  async getAlertById(alertId: string, viewer: AlertViewer): Promise<SOSAlertDTO | null> {
    return getSafetyLocationModule().sos.getAlertById(alertId, viewer);
  },

  /** A rider's own open alerts, regardless of location-sharing state — for a "your active SOS
   * alert" Home banner, distinct from `getActiveAlerts`'s location-gated community browse list. */
  async getMyActiveAlerts(userId: string): Promise<SOSAlertDTO[]> {
    return getSafetyLocationModule().sos.getMyActiveAlerts(userId);
  },

  async getTimeline(alertId: string) {
    return getSafetyLocationModule().ports.sosTimeline.listForAlert(alertId);
  },

  /** Backs "Share Mechanic" / "Share Fuel Contact" quick-actions on an open SOS session.
   * Radius-based off the alert's own coordinates (25km, the same "nearby" meaning used
   * everywhere else partner proximity matters) — not the alert's free-text `city`, which could
   * mismatch a genuinely nearby partner's own free-text `city` on spelling/casing/boundary and
   * hide them for no real reason. */
  async findNearbyPartners(latitude: number, longitude: number, type?: string) {
    return getSafetyLocationModule().ports.partnerDispatch.findNearPoint(latitude, longitude, 25_000, 10, {
      type,
      verifiedOnly: true,
    });
  },

  async resolveAlert(alertId: string, userId: string, isAdmin: boolean) {
    return getSafetyLocationModule().sos.resolveAlert(alertId, userId, isAdmin);
  },

  /** §28 — reporter/admin cancel while dispatching: stops dispatch, expires offers, notifies
   * responders, records the SOS_CANCELLED timeline event. */
  async cancelAlert(alertId: string, userId: string, isAdmin: boolean, reason?: string) {
    return getSafetyLocationModule().sos.cancelAlert(alertId, userId, isAdmin, reason);
  },

  async respondToAlert(alertId: string, responderId: string, message?: string) {
    return getSafetyLocationModule().sos.respondToAlert(alertId, responderId, message);
  },

  async getAlertHistory(userId: string) {
    return getSafetyLocationModule().sos.getAlertHistory(userId);
  },

  async autoResolveStaleAlerts(minutes: number) {
    return getSafetyLocationModule().sos.autoResolveStaleAlerts(minutes);
  },

  /** Warn the reporter when SOS responders cannot reach them by phone. */
  async getProfileWarning(userId: string): Promise<string | null> {
    return getSafetyLocationModule().sos.getProfileWarning(userId);
  },
};
