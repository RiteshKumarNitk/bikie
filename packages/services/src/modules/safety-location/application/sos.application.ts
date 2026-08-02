import type { SOSAlertCreateInput, SOSAlertDTO } from "@bikie/types";
import type { SafetyLocationPorts } from "../ports";

export function createSosApplication(ports: SafetyLocationPorts) {
  return {
    createAlert(userId: string, data: SOSAlertCreateInput): Promise<SOSAlertDTO> {
      return ports.sosAlerts.createAlert({ userId, ...data });
    },

    getActiveAlerts(city?: string): Promise<SOSAlertDTO[]> {
      return ports.sosAlerts.getActiveAlerts(city);
    },

    resolveAlert(alertId: string, userId: string) {
      return ports.sosAlerts.resolveAlert(alertId, userId);
    },

    respondToAlert(alertId: string, responderId: string, message?: string) {
      return ports.sosAlerts.respondToAlert(alertId, responderId, message);
    },

    getAlertHistory(userId: string) {
      return ports.sosAlerts.getAlertHistory(userId);
    },

    autoResolveStaleAlerts(minutes: number) {
      return ports.sosAlerts.autoResolveStaleAlerts(minutes);
    },

    /** Warn the reporter when SOS responders cannot reach them by phone. */
    async getProfileWarning(userId: string): Promise<string | null> {
      const user = await ports.userContact.findSosContactFields(userId);
      const missingFields: string[] = [];
      if (!user?.phone) missingFields.push("phone number");
      if (missingFields.length === 0) return null;
      return `Your profile is missing: ${missingFields.join(", ")}. Update your profile so responders can reach you.`;
    },
  };
}

export type SosApplication = ReturnType<typeof createSosApplication>;
