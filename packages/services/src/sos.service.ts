import { sosRepository } from "@bikie/database";
import type { SOSAlertDTO, SOSAlertCreateInput } from "@bikie/types";

export const SOSService = {
  async createAlert(userId: string, data: SOSAlertCreateInput): Promise<SOSAlertDTO> {
    return sosRepository.createAlert({ userId, ...data });
  },

  async getActiveAlerts(city?: string): Promise<SOSAlertDTO[]> {
    return sosRepository.getActiveAlerts(city);
  },

  async resolveAlert(alertId: string, userId: string) {
    return sosRepository.resolveAlert(alertId, userId);
  },

  async respondToAlert(alertId: string, responderId: string, message?: string) {
    return sosRepository.respondToAlert(alertId, responderId, message);
  },

  async getAlertHistory(userId: string) {
    return sosRepository.getAlertHistory(userId);
  },

  async autoResolveStaleAlerts(minutes: number) {
    return sosRepository.autoResolveStaleAlerts(minutes);
  },
};