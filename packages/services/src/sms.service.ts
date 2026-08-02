import { getCommunicationsPorts, type ChannelResult } from "./modules/communications/public";

export type SMSResult = ChannelResult & { provider: "twilio" | "dev" | string };

/**
 * Compatibility facade — Twilio details live in the SMS adapter.
 */
export const SMSService = {
  async send(to: string, message: string): Promise<SMSResult> {
    return getCommunicationsPorts().sms.send(to, message);
  },

  async sendSOSAlert(phone: string, type: string, city: string, mapsUrl?: string) {
    const mapLine = mapsUrl ? ` Map: ${mapsUrl}` : "";
    return this.send(phone, `BIKIE SOS: ${type} alert in ${city}.${mapLine} Open BIKIE → Dashboard → SOS.`);
  },
};
