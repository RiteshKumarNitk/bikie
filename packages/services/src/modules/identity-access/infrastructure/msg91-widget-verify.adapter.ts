import { fetchWithTimeout } from "../../../lib/http";
import type { Msg91WidgetVerifyPort } from "../ports";

const VERIFY_URL = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

/**
 * Server-side re-verification of the MSG91 Widget SDK's access token (ADR-034). The widget runs
 * entirely client-side (browser talks to MSG91 directly), so a client claiming "the widget said
 * success" is not proof by itself — this call is the actual trust boundary. MSG91's exact
 * response schema for the verified phone number wasn't confirmed from renderable docs at
 * implementation time; `phoneNumber` is parsed defensively and may be null until live-verified
 * against a real widget flow (see ADR-034's "not yet load-bearing" list).
 */
export function createMsg91WidgetVerifyAdapter(): Msg91WidgetVerifyPort {
  return {
    async verifyAccessToken(accessToken) {
      const authKey = process.env.MSG91_AUTH_KEY?.trim();
      if (!authKey) {
        console.log("[MSG91-WIDGET][DEV] verifyAccessToken skipped, not configured");
        return { verified: false, phoneNumber: null };
      }

      const res = await fetchWithTimeout(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ authkey: authKey, "access-token": accessToken }),
      });

      const body = await res.text();
      if (!res.ok || body.includes('"type":"error"')) {
        console.log(`[MSG91-WIDGET][VERIFY] rejected: ${body}`);
        return { verified: false, phoneNumber: null };
      }

      let phoneNumber: string | null = null;
      try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        const candidate = parsed.mobile ?? parsed.identifier ?? parsed.message;
        if (typeof candidate === "string" && /^\+?\d{6,15}$/.test(candidate)) {
          phoneNumber = candidate;
        }
      } catch {
        // Response wasn't parseable JSON with a recognizable phone field — fall through with
        // verified:true but phoneNumber:null; callers must still cross-check against the
        // phoneNumber the client supplied where possible.
      }

      return { verified: true, phoneNumber };
    },
  };
}
