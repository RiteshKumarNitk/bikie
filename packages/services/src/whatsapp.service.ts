import {
  getCommunicationsPorts,
  whatsappShareUrl,
  type ChannelResult,
} from "./modules/communications/public";

export type WhatsAppResult = ChannelResult & { provider: "meta" | "twilio" | "dev" | string };

export { whatsappShareUrl };

/**
 * Compatibility facade — Meta/Twilio/DEV selection lives in the WhatsApp adapter.
 */
export const WhatsAppService = {
  async send(to: string, message: string): Promise<WhatsAppResult> {
    return getCommunicationsPorts().whatsapp.send(to, message);
  },

  async sendLocation(
    to: string,
    location: { latitude: number; longitude: number; name?: string; address?: string },
  ): Promise<WhatsAppResult> {
    return getCommunicationsPorts().whatsapp.sendLocation(to, location);
  },

  async sendSOSAlert(phone: string, message: string) {
    return this.send(phone, message);
  },
};
