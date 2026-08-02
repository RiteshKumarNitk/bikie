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

  async resolveAlert(alertId: string, userId: string) {
    return getSafetyLocationModule().sos.resolveAlert(alertId, userId);
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
