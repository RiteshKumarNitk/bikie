import { getCommunicationsPorts, type ChannelResult } from "./modules/communications/public";

export type SMSResult = ChannelResult & { provider: "msg91" | "dev" | string };

/**
 * Compatibility facade — MSG91 details live in the SMS adapter.
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
