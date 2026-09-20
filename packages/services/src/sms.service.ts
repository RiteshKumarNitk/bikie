import { getCommunicationsPorts, type ChannelResult } from "./modules/communications/public";

export type SMSResult = ChannelResult & { provider: "msg91" | "dev" | "unconfigured" | string };

/**
 * BIKIE has THREE distinct MSG91 SMS types, one template each, never shared (ADR-077):
 *
 *   - OTP           → MSG91_OTP_TEMPLATE_ID  (native OTP adapter, `msg91-native-otp.adapter.ts`) — DLT, v2 sendsms
 *   - Membership    → MSG91_MEMBERSHIP_SUB_TEMPLATE_ID — DLT, v2 sendsms
 *   - SOS / Amber   → MSG91_SOS_FLOW_TEMPLATE_ID — MSG91 Flow API (v5/flow), NOT a DLT_TE_ID
 *     (`safety-location/application/fan-out.application.ts`'s `sendSosSmsSequentially`, not this
 *     file — SOS SMS never went through `SMSService`). `SOS_HELP` below is kept for reference
 *     only; it is not read by any live send path.
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
  /** Not read by any live send path — SOS/Amber SMS now uses the MSG91 Flow API
   * (`MSG91_SOS_FLOW_TEMPLATE_ID`, `fan-out.application.ts`), not this DLT template id. Kept for
   * `buildSmsTemplateBody`/`diagnose-sms-body.cjs` reference only. */
  SOS_HELP: "MSG91_SOS_HELP_TEMPLATE_ID",
  /** "BIKIE_Sub" DLT template — Rider membership-purchased confirmation (ADR-058). Its
   * registered text is annual-specific ("BIKIE annual Membership") — never used for a Service
   * Provider, whose plan is monthly. See `PARTNER_MEMBERSHIP_SUBSCRIBED` below. */
  MEMBERSHIP_SUBSCRIBED: "MSG91_MEMBERSHIP_SUB_TEMPLATE_ID",
  /** Service Provider membership-purchased confirmation (ADR-080) — a *separate*, not-yet-
   * registered DLT template, because the Rider template's fixed text doesn't fit a monthly
   * plan. `sendPartnerMembershipSubscribed` refuses (unconfigured) until both this id AND
   * `PARTNER_MEMBERSHIP_SUBSCRIBED_TEXT` are set — see that function's doc comment. */
  PARTNER_MEMBERSHIP_SUBSCRIBED: "MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID",
} as const;

/** The Service Provider membership template's fixed DLT text, exactly as MSG91 approved it, with
 * `{name}` / `{renewalDate}` marking where the two dynamic values go. Deliberately NOT hardcoded
 * in source (BIKIE does not have an approved SP template yet, and must not invent one) — the
 * operator pastes the exact approved wording here once it's registered, and
 * `sendPartnerMembershipSubscribed` starts working with no further code change or deploy. */
const PARTNER_MEMBERSHIP_SUBSCRIBED_TEXT_ENV = "MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT";

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

/** `DD-Mon-YYYY`, hyphenated (no spaces) — a DLT-variable-safe rendering shared by every
 * membership confirmation SMS's renewal-date slot. */
function formatRenewalDate(renewalDate: Date): string {
  return renewalDate
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
}

/** ADR-058 — the fixed body of the "BIKIE_Sub" DLT template. MSG91's v2 sendsms takes the fully
 * rendered text, so this string must match the registered template exactly except for the two
 * variable slots (rider name, renewal date). Kept here (not inline) so the operator has one
 * place to align it with whatever text they register. */
export function buildMembershipSubscribedBody(name: string, renewalDate: Date): string {
  return (
    `Hello Rider ${name}; Welcome to BIKIE Community, You are successfully subscribed for ` +
    `BIKIE annual Membership, your membership will be renewed on ${formatRenewalDate(renewalDate)} as Noted by KSHIDL`
  );
}

/** ADR-080 — renders a Service Provider membership confirmation from the operator-supplied
 * `MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT` (the exact approved DLT wording, once that
 * template exists), substituting `{name}` and `{renewalDate}`. Never falls back to
 * `buildMembershipSubscribedBody` — the Rider template's fixed text is wrong for a monthly plan
 * and BIKIE must not send it to a Service Provider just because a template id happens to be set. */
export function buildPartnerMembershipSubscribedBody(name: string, renewalDate: Date, template: string): string {
  return template
    .replaceAll("{name}", name)
    .replaceAll("{renewalDate}", formatRenewalDate(renewalDate));
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

  /**
   * ADR-080 — Service Provider membership-purchased confirmation. Separate from
   * `sendMembershipSubscribed`: the only registered membership template says "BIKIE annual
   * Membership" and the Service Provider plan is monthly, so that template is never reused here
   * (see `PartnerMembershipService.purchaseMembership`'s doc comment). Refuses (`unconfigured`,
   * no MSG91 call) unless BOTH `MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_ID` (the DLT template id)
   * AND `MSG91_PARTNER_MEMBERSHIP_SUB_TEMPLATE_TEXT` (the exact approved wording, with `{name}`/
   * `{renewalDate}` placeholders) are configured — once the operator registers a real SP
   * template and sets both, this starts sending with no code change or deploy. The invoice's
   * `confirmationSmsSentAt` guard (identical to the Rider path) still applies at the call site.
   */
  async sendPartnerMembershipSubscribed(phoneNumber: string, name: string, renewalDate: Date): Promise<SMSResult> {
    const templateId = resolveSmsTemplateId(
      MSG91_SMS_TEMPLATE_ENV.PARTNER_MEMBERSHIP_SUBSCRIBED,
      "partner-membership-subscribed",
    );
    const templateText = process.env[PARTNER_MEMBERSHIP_SUBSCRIBED_TEXT_ENV]?.trim();
    if (!templateText) {
      console.error(
        `[SMS][CONFIG] ${PARTNER_MEMBERSHIP_SUBSCRIBED_TEXT_ENV} is not set — the ` +
          `"partner-membership-subscribed" SMS was NOT sent. Set it to the exact DLT-approved ` +
          `Service Provider membership wording (with {name}/{renewalDate} placeholders) once ` +
          `that template is registered. Never falls back to the Rider annual template.`,
      );
    }
    if (!templateId || !templateText) {
      return {
        ok: false,
        provider: "unconfigured",
        error: `${MSG91_SMS_TEMPLATE_ENV.PARTNER_MEMBERSHIP_SUBSCRIBED} / ${PARTNER_MEMBERSHIP_SUBSCRIBED_TEXT_ENV} not configured`,
      };
    }
    return getCommunicationsPorts().sms.send(
      phoneNumber,
      buildPartnerMembershipSubscribedBody(name, renewalDate, templateText),
      templateId,
      "partner-membership-subscribed",
    );
  },
};
