import type { ChannelResult, SmsPort } from "../ports";
import { maskPhone } from "../domain/phone";
import { fetchWithTimeout } from "./http";

/** Turn an MSG91 rejection (HTTP status + response body) into a short, operator-actionable
 * reason naming the most likely misconfiguration. The full raw body is still logged/returned
 * alongside — this only front-loads the diagnosis (ADR-079, task §13). */
function classifyMsg91Failure(status: number, body: string): string {
  const b = body.toLowerCase();
  if (status === 401 || status === 403 || b.includes("authkey") || b.includes("auth key") || b.includes("authentication"))
    return "MSG91 rejected the auth key — check MSG91_AUTH_KEY";
  if (b.includes("sender") || b.includes("dlt_pe_id") || b.includes("principal entity"))
    return "MSG91 rejected the sender id — MSG91_SENDER_ID must be a DLT-approved header (KSHIDL)";
  if (b.includes("template") || b.includes("dlt_te_id") || b.includes("content mismatch") || b.includes("dlt"))
    return "MSG91/DLT rejected the template — check the MSG91_*_TEMPLATE_ID for this SMS type and that the rendered text matches the registered DLT template exactly";
  if (b.includes("mobile") || b.includes("number") || b.includes("recipient") || b.includes("invalid to"))
    return "MSG91 rejected the recipient number";
  if (b.includes("balance") || b.includes("credit") || b.includes("insufficient"))
    return "MSG91 account has insufficient balance";
  return `MSG91 rejected the send (HTTP ${status})`;
}

/** MSG91 v2 `sendsms` returns `{ "type": "success", "message": "<request-id>" }` on acceptance.
 * Pull the request id out so it can be logged/persisted for a dashboard/DLR trace. */
function extractMsg91RequestId(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { message?: unknown; request_id?: unknown };
    const id = parsed.request_id ?? parsed.message;
    return typeof id === "string" && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

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
        // MSG91_AUTH_KEY/MSG91_SENDER_ID are set, i.e. never in a configured deployment. The
        // phone number itself is still masked — this can end up in shared dev/CI console output.
        console.log(`[SMS][DEV] ${tag}To: ${maskPhone(to)} | Message: ${message}`);
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
          `[SMS][CONFIG] ${tag}sending to ${maskPhone(to)} with no DLT template id — MSG91/DLT will likely ` +
            `reject this. Set the matching MSG91_*_TEMPLATE_ID for this SMS type.`,
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
        // OTPs — those go through msg91-native-otp.adapter.ts). The classified reason front-loads
        // the likely cause (auth / sender / DLT template / number / balance) so a rejection is
        // actionable from the log line alone (task §13).
        const reason = classifyMsg91Failure(res.status, body);
        console.error(
          `[SMS] ${tag}Failed to ${maskPhone(to)} (template ${templateId ?? "none"}): ${reason} :: ${body.slice(0, 400)}`,
        );
        return { ok: false, provider: "msg91", error: `${reason} :: ${body.slice(0, 400)}` };
      }

      // Gateway ACCEPTANCE, not handset delivery — MSG91 confirms the final state only via its
      // delivery report (DLR webhook / report API), which BIKIE does not currently ingest. The
      // request id is logged and returned so a send can be traced in the MSG91 dashboard.
      const requestId = extractMsg91RequestId(body);
      console.log(
        `[SMS][MSG91] ${tag}Accepted for ${maskPhone(to)} (template ${templateId ?? "none"})` +
          `${requestId ? ` reqId=${requestId}` : ""} — gateway acceptance, not proof of handset delivery`,
      );
      return { ok: true, provider: "msg91", detail: requestId ?? undefined };
    },
  };
}
