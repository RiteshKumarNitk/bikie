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

  /**
   * ADR-058 — the DLT-approved "BIKIE_Sub" template (Sender ID `KSHIDL`, template ID
   * `MSG91_MEMBERSHIP_SUB_TEMPLATE_ID`), fired once a **Rider** membership purchase succeeds.
   * `message` below must match the registered template's fixed text exactly (Indian carriers'
   * DLT content firewall rejects anything that doesn't) — only the two `##alphanumeric##`
   * variables (name, renewal date) actually vary. Rider-specific: the template's own copy says
   * "annual Membership," which is only true of the Rider plan (₹99/365 days) — the Service
   * Provider plan is ₹99/*month* (ADR-056) and would need its own separately DLT-registered
   * template if this copy is ever wanted there too, never this one.
   */
  async sendMembershipSubscribed(phoneNumber: string, name: string, renewalDate: Date) {
    const formattedRenewal = renewalDate
      .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      .replace(/ /g, "-");
    const message =
      `Hello Rider ${name}; Welcome to BIKIE Community, You are successfully subscribed for ` +
      `BIKIE annual Membership, your membership will be renewed on ${formattedRenewal} as Noted by KSHIDL`;
    return getCommunicationsPorts().sms.send(
      phoneNumber,
      message,
      process.env.MSG91_MEMBERSHIP_SUB_TEMPLATE_ID?.trim() || undefined,
    );
  },
};
