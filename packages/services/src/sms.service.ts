import { getCommunicationsPorts, type ChannelResult } from "./modules/communications/public";

export type SMSResult = ChannelResult & { provider: "msg91" | "dev" | "unconfigured" | string };

/**
 * BIKIE has exactly THREE MSG91 DLT templates, one per SMS type, never shared (ADR-077):
 *
 *   - OTP           → MSG91_OTP_TEMPLATE_ID  (native OTP adapter, `msg91-native-otp.adapter.ts`)
 *   - Membership    → MSG91_MEMBERSHIP_SUB_TEMPLATE_ID
 *   - SOS / Amber   → MSG91_SOS_HELP_TEMPLATE_ID
 *
 * Each typed sender resolves its own id here; if the var is unset it logs a clear configuration
 * error and the send is refused rather than falling back to another type's template (India's DLT
 * content firewall would reject a mismatched body anyway). Credentials (`MSG91_AUTH_KEY` /
 * `MSG91_SENDER_ID`) live only in the adapter, server-side.
 *
 * There is NO "generic SOS" template. The old `MSG91_TEMPLATE_ID` is deprecated — no product SMS
 * reads it; only the internal `/admin/sms` free-text tool (`SMSService.send`) ever did, and it
 * now sends untemplated.
 */
export const MSG91_SMS_TEMPLATE_ENV = {
  /** "BIKIE_SR" DLT template — the SOS / Amber assistance SMS to every dispatch recipient. */
  SOS_HELP: "MSG91_SOS_HELP_TEMPLATE_ID",
  /** "BIKIE_Sub" DLT template — Rider membership-purchased confirmation (ADR-058). */
  MEMBERSHIP_SUBSCRIBED: "MSG91_MEMBERSHIP_SUB_TEMPLATE_ID",
} as const;

/** Resolve a typed SMS's DLT template id from its own env var. Returns `null` (and logs exactly
 * which var to set) when unset — the caller MUST then not send, never borrow another template. */
export function resolveSmsTemplateId(envVar: string, smsType: string): string | null {
  const id = process.env[envVar]?.trim();
  if (!id) {
    console.error(
      `[SMS][CONFIG] ${envVar} is not set — the "${smsType}" SMS was NOT sent. ` +
        `Set ${envVar} on the server to this message's DLT-approved MSG91 template id. ` +
        `Refusing to send it under an unrelated template.`,
    );
    return null;
  }
  return id;
}

/** ADR-058 — the fixed body of the "BIKIE_Sub" DLT template. MSG91's v2 sendsms takes the fully
 * rendered text, so this string must match the registered template exactly except for the two
 * variable slots (rider name, renewal date). Kept here (not inline) so the operator has one
 * place to align it with whatever text they register. */
export function buildMembershipSubscribedBody(name: string, renewalDate: Date): string {
  const formattedRenewal = renewalDate
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
  return (
    `Hello Rider ${name}; Welcome to BIKIE Community, You are successfully subscribed for ` +
    `BIKIE annual Membership, your membership will be renewed on ${formattedRenewal} as Noted by KSHIDL`
  );
}

/**
 * Compatibility facade — MSG91 wire details live in the SMS adapter.
 */
export const SMSService = {
  /** Internal free-text SMS for the `/admin/sms` manual sender ONLY — not one of BIKIE's three
   * DLT-registered product templates (OTP / membership / SOS), so it is sent with no template
   * id. Whether it actually delivers depends on the MSG91 account's policy for untemplated
   * transactional SMS; product SMS must use the typed senders below. */
  async send(to: string, message: string): Promise<SMSResult> {
    return getCommunicationsPorts().sms.send(to, message, undefined, "admin-manual");
  },

  /**
   * ADR-058 — Rider membership-purchased confirmation, the "BIKIE_Sub" DLT template
   * (`MSG91_MEMBERSHIP_SUB_TEMPLATE_ID`). Fired once, only after a payment is verified and the
   * membership + invoice are written (`MembershipService.purchaseMembership`), and never for a
   * Service Provider (its plan is monthly, not the template's "annual"). If the template id is
   * unset the SMS is refused with an `unconfigured` result (logged) — the invoice's
   * `confirmationSmsSentAt` stays null so it retries on the next purchase once configured.
   */
  async sendMembershipSubscribed(phoneNumber: string, name: string, renewalDate: Date): Promise<SMSResult> {
    const templateId = resolveSmsTemplateId(
      MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED,
      "membership-subscribed",
    );
    if (!templateId) {
      return {
        ok: false,
        provider: "unconfigured",
        error: `${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED} not configured`,
      };
    }
    return getCommunicationsPorts().sms.send(
      phoneNumber,
      buildMembershipSubscribedBody(name, renewalDate),
      templateId,
      "membership-subscribed",
    );
  },
};
