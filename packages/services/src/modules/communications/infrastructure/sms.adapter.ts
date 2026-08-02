import type { ChannelResult, SmsPort } from "../ports";
import { fetchWithTimeout } from "./http";

function twilioSmsCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  // TWILIO_PHONE_NUMBER is the name used by existing deployments' env files.
  const from = process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!accountSid || !authToken || (!messagingServiceSid && !from)) return null;
  return { accountSid, authToken, messagingServiceSid, from };
}

/** Twilio SMS adapter with DEV fallback — preserves legacy SMSService behavior. */
export function createSmsAdapter(): SmsPort {
  return {
    isConfigured() {
      return twilioSmsCredentials() !== null;
    },

    async send(to: string, message: string): Promise<ChannelResult> {
      const credentials = twilioSmsCredentials();
      if (!credentials) {
        console.log(`[SMS][DEV] To: ${to} | Message: ${message}`);
        return { ok: false, provider: "dev", error: "Twilio credentials not configured" };
      }

      const { accountSid, authToken, messagingServiceSid, from } = credentials;
      const params: Record<string, string> = { To: to, Body: message };
      if (messagingServiceSid) params.MessagingServiceSid = messagingServiceSid;
      else params.From = from!;

      const res = await fetchWithTimeout(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(params),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        console.error(`[SMS] Failed to ${to}: ${body}`);
        return { ok: false, provider: "twilio", error: body };
      }

      console.log(`[SMS][TWILIO] Sent to ${to}`);
      return { ok: true, provider: "twilio" };
    },
  };
}
