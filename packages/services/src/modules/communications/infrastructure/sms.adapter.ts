import type { ChannelResult, SmsPort } from "../ports";
import { fetchWithTimeout } from "./http";

/** Auth credentials only — server-side, never exposed to any client. The DLT template id is NOT
 * read here: each SMS *type* passes its own (see `SmsPort.send`), and the adapter never
 * substitutes one type's template for another. */
function msg91Credentials() {
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  const senderId = process.env.MSG91_SENDER_ID?.trim();
  if (!authKey || !senderId) return null;
  const route = process.env.MSG91_ROUTE?.trim() || "4";
  return { authKey, senderId, route };
}

/** MSG91 SMS adapter (v2 sendsms) with a DEV fallback when credentials are unset. */
export function createSmsAdapter(): SmsPort {
  return {
    isConfigured() {
      return msg91Credentials() !== null;
    },

    async send(to: string, message: string, templateId?: string, label?: string): Promise<ChannelResult> {
      const tag = label ? `[${label}] ` : "";
      const credentials = msg91Credentials();
      if (!credentials) {
        // DEV log carries the body deliberately (local visibility); it never runs when
        // MSG91_AUTH_KEY/MSG91_SENDER_ID are set, i.e. never in a configured deployment.
        console.log(`[SMS][DEV] ${tag}To: ${to} | Message: ${message}`);
        return { ok: false, provider: "dev", error: "MSG91 credentials not configured" };
      }

      const { authKey, senderId, route } = credentials;
      const mobile = to.replace(/^\+/, "");
      const smsEntry: Record<string, unknown> = { message, to: [mobile] };
      if (templateId) {
        smsEntry.DLT_TE_ID = templateId;
      } else {
        // No template id supplied for this send. We do NOT reach for another type's template —
        // the send goes out template-less and India's DLT content firewall will very likely
        // reject it. The caller is expected to have logged which MSG91_*_TEMPLATE_ID to set.
        console.warn(
          `[SMS][CONFIG] ${tag}sending to ${to} with no DLT template id — MSG91/DLT will likely reject this. ` +
            `Set the matching MSG91_*_TEMPLATE_ID for this SMS type.`,
        );
      }

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
        // MSG91's response body — safe to log (no auth key, no OTP; this adapter never carries
        // OTPs — those go through msg91-native-otp.adapter.ts).
        console.error(`[SMS] ${tag}Failed to ${to} (template ${templateId ?? "none"}): ${body.slice(0, 400)}`);
        return { ok: false, provider: "msg91", error: body };
      }

      console.log(`[SMS][MSG91] ${tag}Sent to ${to} (template ${templateId ?? "none"})`);
      return { ok: true, provider: "msg91" };
    },
  };
}
