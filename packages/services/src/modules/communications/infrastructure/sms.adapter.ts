import type { ChannelResult, SmsPort } from "../ports";
import { fetchWithTimeout } from "./http";

function msg91Credentials() {
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  const senderId = process.env.MSG91_SENDER_ID?.trim();
  if (!authKey || !senderId) return null;
  const route = process.env.MSG91_ROUTE?.trim() || "4";
  // DLT template ID — required by Indian carriers' content firewall for transactional SMS.
  // Optional here because MSG91 will reject at send time (not at config-check time) if your
  // sender ID's DLT registration requires it and it's missing.
  const templateId = process.env.MSG91_TEMPLATE_ID?.trim();
  return { authKey, senderId, route, templateId };
}

/** MSG91 SMS adapter (v2 sendsms) with DEV fallback — preserves legacy SMSService behavior. */
export function createSmsAdapter(): SmsPort {
  return {
    isConfigured() {
      return msg91Credentials() !== null;
    },

    async send(to: string, message: string): Promise<ChannelResult> {
      const credentials = msg91Credentials();
      if (!credentials) {
        console.log(`[SMS][DEV] To: ${to} | Message: ${message}`);
        return { ok: false, provider: "dev", error: "MSG91 credentials not configured" };
      }

      const { authKey, senderId, route, templateId } = credentials;
      const mobile = to.replace(/^\+/, "");
      const smsEntry: Record<string, unknown> = { message, to: [mobile] };
      if (templateId) smsEntry.DLT_TE_ID = templateId;

      const res = await fetchWithTimeout("https://api.msg91.com/api/v2/sendsms", {
        method: "POST",
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: senderId,
          route,
          country: "91",
          sms: [smsEntry],
        }),
      });

      const body = await res.text();
      if (!res.ok || body.includes('"type":"error"')) {
        console.error(`[SMS] Failed to ${to}: ${body}`);
        return { ok: false, provider: "msg91", error: body };
      }

      console.log(`[SMS][MSG91] Sent to ${to}`);
      return { ok: true, provider: "msg91" };
    },
  };
}
