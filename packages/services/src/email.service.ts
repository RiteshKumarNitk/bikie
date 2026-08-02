import { getCommunicationsPorts, type ChannelResult } from "./modules/communications/public";

export type EmailResult = ChannelResult & { provider: "smtp" | "resend" | "dev" | string };

/**
 * Compatibility facade — business callers keep importing EmailService.
 * Provider selection (SMTP → Resend → DEV) lives in the email adapter.
 */
export const EmailService = {
  async send(payload: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailResult> {
    return getCommunicationsPorts().email.send(payload);
  },

  async sendBookingConfirmation(email: string, bikeName: string, startDate: string, endDate: string) {
    await this.send({
      to: email,
      subject: `Booking Confirmed – ${bikeName}`,
      html: `
        <h2>Booking Confirmed</h2>
        <p>Your booking for <strong>${bikeName}</strong> is confirmed.</p>
        <p>Start: ${startDate}<br/>End: ${endDate}</p>
      `,
    });
  },

  async sendSOSAlert(email: string, type: string, city: string, mapsUrl?: string) {
    await this.send({
      to: email,
      subject: `SOS Alert: ${type}`,
      html: `<h2>SOS Alert</h2><p>Type: ${type}</p><p>City: ${city}</p>
             ${mapsUrl ? `<p><a href="${mapsUrl}">Open live GPS on Google Maps</a></p>` : ""}
             <p>Open BIKIE → Dashboard → SOS to respond.</p>`,
    });
  },
};
