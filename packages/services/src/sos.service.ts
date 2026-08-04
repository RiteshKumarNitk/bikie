import { getSafetyLocationModule } from "./modules/safety-location/public";
import type { SOSAlertDTO, SOSAlertCreateInput } from "@bikie/types";

/** Compatibility facade — routes keep importing SOSService. */
export const SOSService = {
  async createAlert(userId: string, data: SOSAlertCreateInput): Promise<SOSAlertDTO> {
    return getSafetyLocationModule().sos.createAlert(userId, data);
  },

  async getActiveAlerts(city?: string): Promise<SOSAlertDTO[]> {
    return getSafetyLocationModule().sos.getActiveAlerts(city);
  },

  async getAlertById(alertId: string): Promise<SOSAlertDTO | null> {
    return getSafetyLocationModule().sos.getAlertById(alertId);
  },

  async getTimeline(alertId: string) {
    return getSafetyLocationModule().ports.sosTimeline.listForAlert(alertId);
  },

  /** Backs "Share Mechanic" / "Share Fuel Contact" quick-actions on an open SOS session. */
  async findNearbyPartners(city: string, type?: string) {
    return getSafetyLocationModule().ports.partnerDispatch.findByCity(city, 10, { type, verifiedOnly: true });
  },

  async resolveAlert(alertId: string, userId: string, isAdmin: boolean) {
    return getSafetyLocationModule().sos.resolveAlert(alertId, userId, isAdmin);
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
