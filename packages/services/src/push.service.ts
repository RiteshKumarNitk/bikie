import { getCommunicationsPorts } from "./modules/communications/public";

/**
 * Compatibility facade — FCM details live in the push adapter.
 */
export const PushService = {
  async registerToken(userId: string, token: string): Promise<void> {
    const ports = getCommunicationsPorts();
    if (ports.push.registerToken) await ports.push.registerToken(userId, token);
  },

  async unregisterToken(token: string): Promise<void> {
    const ports = getCommunicationsPorts();
    if (ports.push.unregisterToken) await ports.push.unregisterToken(token);
  },

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    await getCommunicationsPorts().push.sendToUser(userId, payload);
  },
};
