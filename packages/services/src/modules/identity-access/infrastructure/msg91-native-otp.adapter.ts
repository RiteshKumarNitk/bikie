import type { ChannelResult } from "../../communications/ports";
import { fetchWithTimeout } from "../../../lib/http";
import type { Msg91NativeOtpPort } from "../ports";

const BASE_URL = "https://control.msg91.com/api/v5/otp";

function credentials() {
  const authKey = process.env.MSG91_AUTH_KEY?.trim();
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim();
  if (!authKey || !templateId) return null;
  return { authKey, templateId };
}

/** MSG91 returns HTTP 200 regardless of logical outcome — same quirk as the plain sendsms
 * API (sms.adapter.ts) — so success/failure has to be read from the response body. */
function isErrorBody(body: string): boolean {
  return body.includes('"type":"error"');
}

/**
 * MSG91's native server-to-server OTP API (ADR-034) — the OTP-authority path for Flutter, which
 * has no equivalent to the browser-only Widget SDK. `template_id` here is intentionally a
 * separate env var from `MSG91_TEMPLATE_ID` (used by sms.adapter.ts for plain SOS SMS): OTP
 * content must match its own DLT-approved template, not the SOS one.
 */
export function createMsg91NativeOtpAdapter(): Msg91NativeOtpPort {
  return {
    async send(phoneNumber, { otpLength, expirySeconds }): Promise<ChannelResult> {
      const creds = credentials();
      if (!creds) {
        console.log(`[MSG91-OTP][DEV] send skipped, not configured: ${phoneNumber}`);
        return { ok: false, provider: "dev", error: "MSG91 OTP credentials not configured" };
      }

      const mobile = phoneNumber.replace(/^\+/, "");
      const params = new URLSearchParams({
        template_id: creds.templateId,
        mobile,
        otp_length: String(otpLength),
        otp_expiry: String(Math.max(1, Math.round(expirySeconds / 60))),
      });

      const res = await fetchWithTimeout(`${BASE_URL}?${params.toString()}`, {
        method: "POST",
        headers: { authkey: creds.authKey, Accept: "application/json" },
      });

      const body = await res.text();
      if (!res.ok || isErrorBody(body)) {
        console.error(`[MSG91-OTP] Send failed for ${phoneNumber}: ${body}`);
        return { ok: false, provider: "msg91", error: body };
      }

      console.log(`[MSG91-OTP] Sent to ${phoneNumber}`);
      return { ok: true, provider: "msg91" };
    },

    async verify(phoneNumber, code): Promise<boolean> {
      const creds = credentials();
      if (!creds) {
        console.log(`[MSG91-OTP][DEV] verify skipped, not configured: ${phoneNumber}`);
        return false;
      }

      const mobile = phoneNumber.replace(/^\+/, "");
      const params = new URLSearchParams({ mobile, otp: code });

      const res = await fetchWithTimeout(`${BASE_URL}/verify?${params.toString()}`, {
        method: "GET",
        headers: { authkey: creds.authKey, Accept: "application/json" },
      });

      const body = await res.text();
      if (!res.ok || isErrorBody(body)) {
        console.log(`[MSG91-OTP][VERIFY] rejected for ${phoneNumber}: ${body}`);
        return false;
      }

      return true;
    },
  };
}
