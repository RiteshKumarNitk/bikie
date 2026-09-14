import { isValidIndianMobile, maskPhone, toE164Phone } from "../../communications/domain/phone";
import { whatsappShareUrl, type CommunicationsPorts } from "../../communications/public";
import type { IdempotencyPort } from "../../platform/public";
import { alertKind } from "../domain/alert-kind";
import {
  channelsForRecipient,
  resolveChannelAvailability,
  type ChannelAvailability,
} from "../domain/channel-selection";
import {
  buildEmailHtml,
  buildSmsTemplateBody,
  buildTextBody,
  describeLocation,
  humanizeSosType,
  type SOSRecipient,
} from "../domain/dispatch-message";
import { formatDistance, mapsNavigateUrl } from "../domain/maps";
import { redactAlertForViewer, type RawSOSAlertDTO } from "../domain/pii-redaction";
import type { SafetyLocationPorts } from "../ports";

/** Which recipient roles are "candidate responder" pools who haven't agreed to anything yet —
 * exact contact info/GPS is withheld from them until one of them is actually assigned (matches
 * the existing in-app browse redaction, ADR-045, now applied consistently to every dispatch
 * channel too). Trusted/designated recipients (the reporter's own emergency contacts, platform
 * admins, emergency services) are unaffected — they're not "responders" in this sense. */
function isCandidateResponder(role: SOSRecipient["role"]): boolean {
  return role === "NEARBY_RIDER" || role === "SERVICE_PROVIDER";
}

/** ADR-059 — MSG91 SMS is billed per message, and the DLT "BIKIE_SR" template names an actual
 * rider by name; capping avoids blasting an unbounded, potentially large nearby pool. */
export const SOS_SMS_RECIPIENT_LIMIT = 10;

/**
 * Marks the nearest `limit` *verified* candidate responders (by `distanceMeters`, ascending; a
 * recipient with no distance sorts last) as SMS-eligible, the rest ineligible — only the SMS
 * channel is capped: in-app push/WhatsApp/email still reach every recipient in the input array
 * unchanged, since under-notifying there has real safety cost and neither is per-message billed
 * the same way SMS is. Callers pass only the combined nearby-rider + service-provider pool for
 * one dispatch batch — never emergency contacts/admins/emergency-services, which aren't capped.
 *
 * "Verified" — before a candidate can occupy one of the `limit` slots, it must have a phone
 * number at all, that number must pass `isValidIndianMobile` (MSG91 would reject anything else —
 * a malformed number must never waste a slot a genuinely reachable candidate #11 could have
 * used), and it must not be a duplicate of a closer candidate's number already counted (e.g. a
 * partner's own number coinciding with their listed contact-person's number). A candidate that
 * fails any of these is simply never `smsEligible: true` — the cap itself always stays at
 * exactly `limit`, never fewer just because some invalid/duplicate numbers happened to sort
 * first. `limit` is a compile-time default (`SOS_SMS_RECIPIENT_LIMIT`, server-side only) — no
 * caller passes it from client input.
 */
export function markSmsEligibility(recipients: SOSRecipient[], limit = SOS_SMS_RECIPIENT_LIMIT): SOSRecipient[] {
  const sorted = [...recipients].sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

  const eligible = new Set<SOSRecipient>();
  const seenPhones = new Set<string>();
  for (const r of sorted) {
    if (eligible.size >= limit) break;
    if (!r.phone) continue;
    const normalized = toE164Phone(r.phone);
    if (!isValidIndianMobile(normalized)) continue;
    if (seenPhones.has(normalized)) continue;
    seenPhones.add(normalized);
    eligible.add(r);
  }

  return recipients.map((r) => ({ ...r, smsEligible: eligible.has(r) }));
}

/** One structured observability line per dispatch batch, right after `markSmsEligibility` — pairs
 * with the per-recipient `SOS_SMS_SENT`/`SOS_SMS_FAILED` lines below to answer "how many
 * candidates were found, how many actually got an SMS attempt (always <= 10), for this alert" at
 * a glance, without a raw phone number or any secret in the line. */
export function logSmsDispatchStart(alertId: string, candidates: SOSRecipient[], selected: SOSRecipient[]): void {
  const selectedCount = selected.filter((r) => r.smsEligible).length;
  console.log(`SOS_SMS_DISPATCH_START sosId=${alertId} candidateCount=${candidates.length} selectedCount=${selectedCount}`);
}

export interface SOSDispatchSummary {
  nearbyRiders: number;
  serviceProviders: number;
  emergencyContacts: number;
  emergencyServices: number;
  smsAttempted: number;
  smsSent: number;
  whatsappAttempted: number;
  whatsappSent: number;
  emailAttempted: number;
  emailSent: number;
  inAppNotified: number;
  /** Admins notified because the alert resolved to zero real recipients (ADR-030). */
  escalatedToAdmins: number;
  /** Populated when a channel has no live credentials, so the alert can still be pushed by hand. */
  whatsappClickToSend: { name: string; phone: string; url: string }[];
  errors: string[];
  /** Which channels this deployment could actually deliver on for this dispatch. */
  channels?: ChannelAvailability;
}

export function emptySummary(channels: ChannelAvailability): SOSDispatchSummary {
  return {
    nearbyRiders: 0,
    serviceProviders: 0,
    emergencyContacts: 0,
    emergencyServices: 0,
    smsAttempted: 0,
    smsSent: 0,
    whatsappAttempted: 0,
    whatsappSent: 0,
    emailAttempted: 0,
    emailSent: 0,
    inAppNotified: 0,
    escalatedToAdmins: 0,
    whatsappClickToSend: [],
    errors: [],
    channels,
  };
}

export type FanOutDeps = {
  communications?: CommunicationsPorts;
  idempotency?: IdempotencyPort;
};

/**
 * ADR-085 — sends the SMS channel ONE RECIPIENT AT A TIME, nearest-first, for a batch of
 * candidates already verified/deduped/capped by `markSmsEligibility` — never `Promise.all`. A
 * failed send is caught and recorded, then the loop moves on to the next recipient; it never
 * aborts the batch. Split out of `dispatchToRecipient` (which still handles WhatsApp/email/
 * in-app for every recipient, unchanged and still fully parallel — neither channel has a
 * "one at a time" requirement, so slowing them down to match SMS would only add latency for no
 * safety benefit) so the two can run concurrently with each other while SMS alone stays
 * serialized within itself. Callers (`fanOut`/`notifyRecipients`) run this alongside the
 * `Promise.all` of `dispatchToRecipient` calls over the same recipient array.
 *
 * `recipient.smsEligible !== false` (true, or unset for a non-capped recipient like an emergency
 * contact) is the same eligibility gate `dispatchToRecipient`'s old inline SMS branch used —
 * preserved exactly so emergency contacts/emergency services (never passed through
 * `markSmsEligibility`, always eligible) keep getting SMS'd here too.
 */
export async function sendSosSmsSequentially(
  alert: RawSOSAlertDTO,
  recipients: SOSRecipient[],
  communications: CommunicationsPorts,
  availability: ChannelAvailability,
  summary: SOSDispatchSummary,
): Promise<void> {
  const smsTemplateId = process.env.MSG91_SOS_HELP_TEMPLATE_ID?.trim() || null;

  const toSend = recipients
    .filter((r) => r.smsEligible !== false && channelsForRecipient(r, availability).sms)
    .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

  for (const recipient of toSend) {
    const phone = toE164Phone(recipient.phone!);
    // Real `phone` is still what's actually sent to the provider — masked only for log lines /
    // `summary.errors` entries, so a production log never carries a full recipient mobile number.
    const maskedPhone = maskPhone(phone);
    const recipientTag = recipient.userId ?? "none";

    if (!smsTemplateId) {
      // ADR-077 — BIKIE has ONE SOS/Amber SMS DLT template ("BIKIE_SR",
      // `MSG91_SOS_HELP_TEMPLATE_ID`), used for every dispatch recipient. No unrelated template
      // is ever substituted — when it's unset the SMS channel is skipped entirely (logged +
      // recorded); WhatsApp/email/in-app are untouched.
      console.error(
        `[SMS][CONFIG] MSG91_SOS_HELP_TEMPLATE_ID is not set — SOS SMS to ${maskedPhone} skipped ` +
          `(no unrelated DLT template is used). WhatsApp / email / in-app are unaffected.`,
      );
      summary.errors.push(`sms → ${maskedPhone}: MSG91_SOS_HELP_TEMPLATE_ID not configured (SMS skipped)`);
      continue;
    }

    const isRedacted = isCandidateResponder(recipient.role);
    const dispatchAlert = redactAlertForViewer(alert, !isRedacted);

    summary.smsAttempted += 1;
    // Structured, per-recipient observability (never the raw phone number, never a secret).
    try {
      // Awaited — the next recipient's send does not start until this one has fully settled,
      // success or failure.
      const result = await communications.sms.send(phone, buildSmsTemplateBody(dispatchAlert), smsTemplateId, "sos-help");
      if (result.ok) {
        summary.smsSent += 1;
        console.log(`SOS_SMS_SENT sosId=${alert.id} recipientUserId=${recipientTag} status=SUCCESS`);
      } else {
        if (result.provider !== "dev") {
          summary.errors.push(`sms → ${maskedPhone}: ${(result.error ?? "unknown error").slice(0, 200)}`);
        }
        console.error(
          `SOS_SMS_FAILED sosId=${alert.id} recipientUserId=${recipientTag} status=FAILED ` +
            `reason=${(result.error ?? "unknown error").slice(0, 200)}`,
        );
      }
    } catch (e) {
      // A thrown/rejected send is caught here, per recipient — it never stops the loop from
      // continuing on to the next recipient.
      summary.errors.push(`sms → ${maskedPhone}: ${String(e)}`);
      console.error(`SOS_SMS_FAILED sosId=${alert.id} recipientUserId=${recipientTag} status=FAILED reason=${String(e).slice(0, 200)}`);
    }
  }
}

async function resolveEmergencyContacts(
  reporterUserId: string,
  ports: SafetyLocationPorts,
): Promise<SOSRecipient[]> {
  const contacts = await ports.emergencyContacts.findByUserId(reporterUserId);
  return contacts.map((c) => ({
    role: "EMERGENCY_CONTACT" as const,
    name: c.relation ? `${c.name} (${c.relation})` : c.name,
    phone: c.phone,
    email: c.email,
  }));
}

/**
 * An alert that resolves to zero recipients is silently useless — the reporter sees "sent"
 * while nobody is told. Escalate to platform admins so someone always picks it up (ADR-030,
 * ADR-033: the check for "zero recipients" now spans contacts/emergency-services/tier-1 nearby
 * riders together — see sos.application.ts's createAlert, which is what actually decides
 * whether to fire this).
 */
export async function resolveEscalationRecipients(ports: SafetyLocationPorts): Promise<SOSRecipient[]> {
  const admins = await ports.escalation.findAdminContacts().catch(() => []);
  return admins.map((a) => ({
    role: "PLATFORM_ADMIN" as const,
    name: a.name,
    phone: a.phone,
    email: a.email,
    userId: a.id,
  }));
}

function resolveEmergencyServices(): SOSRecipient[] {
  const phone = process.env.SOS_EMERGENCY_SERVICES_PHONE?.trim();
  if (!phone) return [];
  return [
    {
      role: "EMERGENCY_SERVICES",
      name: "Emergency Services",
      phone,
      email: process.env.SOS_EMERGENCY_SERVICES_EMAIL?.trim() || null,
    },
  ];
}

export async function dispatchToRecipient(
  alert: RawSOSAlertDTO,
  recipient: SOSRecipient,
  summary: SOSDispatchSummary,
  communications: CommunicationsPorts,
  ports: SafetyLocationPorts,
  availability: ChannelAvailability,
) {
  const channels = channelsForRecipient(recipient, availability);
  const isRedacted = isCandidateResponder(recipient.role);
  // `redactAlertForViewer` already nulls phone/email/exact-GPS/precise-address for a
  // non-privileged viewer (ADR-045) — reused as-is so dispatch text and the in-app browse API
  // stay governed by the exact same rule, not two rules that could drift apart.
  const dispatchAlert = redactAlertForViewer(alert, !isRedacted);
  const text = buildTextBody(dispatchAlert, recipient);
  const navigate =
    dispatchAlert.latitude != null && dispatchAlert.longitude != null
      ? mapsNavigateUrl(dispatchAlert.latitude, dispatchAlert.longitude)
      : null;
  const distance = formatDistance(recipient.distanceMeters);
  const tasks: Promise<void>[] = [];

  const record = (channel: string, target: string, result: { ok: boolean; provider: string; error?: string }) => {
    if (result.ok) return true;
    if (result.provider !== "dev") {
      summary.errors.push(`${channel} → ${target}: ${(result.error ?? "unknown error").slice(0, 200)}`);
    }
    return false;
  };

  if (recipient.phone) {
    const phone = toE164Phone(recipient.phone);
    // Real `phone` is still what's actually sent to the provider — this is only for log lines
    // and `summary.errors` entries (which do reach the console via the [SOS][DISPATCH][ERROR]
    // line below), so a production log never carries a full recipient mobile number.
    const maskedPhone = maskPhone(phone);

    // ADR-085 — SMS is no longer sent from inside this parallel per-recipient dispatch at all.
    // It's handled by `sendSosSmsSequentially`, called by the same batch orchestrators
    // (`fanOut`/`notifyRecipients`) alongside this function — one recipient's SMS attempt fully
    // completes before the next one starts, which `Promise.all`-style dispatch here cannot
    // guarantee. WhatsApp/email/in-app below are unaffected — they have no such requirement and
    // stay parallel across recipients exactly as before.

    if (channels.whatsapp) {
      summary.whatsappAttempted += 1;
      tasks.push(
        communications.whatsapp
          .send(phone, text)
          .then(async (r) => {
            if (record("whatsapp", maskedPhone, r)) {
              summary.whatsappSent += 1;
              // The native location card always carries exact GPS — there's no "approximate"
              // version of it worth sending, so it's skipped entirely for a pre-assignment
              // candidate responder rather than partially redacted.
              if (!isRedacted) {
                await communications.whatsapp
                  .sendLocation(phone, {
                    latitude: alert.latitude,
                    longitude: alert.longitude,
                    name: `${alert.userName} — SOS`,
                    address: alert.city,
                  })
                  .catch(() => undefined);
              }
            } else if (r.provider === "dev") {
              summary.whatsappClickToSend.push({
                name: recipient.name,
                phone,
                url: whatsappShareUrl(phone, text),
              });
            }
          })
          .catch((e) => {
            summary.errors.push(`whatsapp → ${maskedPhone}: ${String(e)}`);
          }),
      );
    } else {
      // No WhatsApp provider: still hand back a click-to-send link for manual escalation.
      summary.whatsappClickToSend.push({
        name: recipient.name,
        phone,
        url: whatsappShareUrl(phone, text),
      });
    }
  }

  if (recipient.email && channels.email) {
    const to = recipient.email;
    summary.emailAttempted += 1;
    tasks.push(
      communications.email
        .send({
          to,
          subject: `BIKIE SOS: ${alert.type} in ${alert.city}`,
          html: buildEmailHtml(dispatchAlert, recipient),
        })
        .then((r) => {
          if (record("email", to, r)) summary.emailSent += 1;
        })
        .catch((e) => {
          summary.errors.push(`email → ${to}: ${String(e)}`);
        }),
    );
  }

  if (recipient.userId) {
    summary.inAppNotified += 1;
    // ADR-044 — partners get purpose-built copy (category + distance + city, no generic
    // "Red/Amber Alert" framing) since they land on the partner request-details screen, not the
    // rider-facing alert list. Everyone else's copy is unchanged.
    let title: string;
    let body: string;
    if (recipient.role === "SERVICE_PROVIDER") {
      title = "🚨 Emergency Assistance Needed";
      body = [`${humanizeSosType(alert.type)} reported near you`, distance ? `📍 ${distance}` : null, alert.city]
        .filter(Boolean)
        .join("\n");
    } else {
      const kind = alertKind(alert.description);
      const distanceBit = distance ? ` You are ~${distance.replace(" away", "")} away.` : "";
      title = kind === "RED" ? "Red Alert nearby" : kind === "AMBER" ? "Amber Alert nearby" : "SOS Alert nearby";
      body = `${dispatchAlert.userName} needs help at ${describeLocation(dispatchAlert)}.${distanceBit}${
        navigate ? ` Open Maps to navigate & see your distance: ${navigate}` : " Open the app for details and to respond."
      }`;
    }
    tasks.push(
      ports.notifications.notify(recipient.userId, "SOS_ALERT", title, body, "sos_alert", alert.id).catch(console.error),
    );
  }

  await Promise.all(tasks);
}

/** Sums two dispatch summaries — used to combine fanOut()'s "always fire" legs (contacts,
 * emergency services) with escalation.seedEscalation()'s tier-1 nearby-rider leg into the one
 * summary the create-alert API response and UI actually render (ADR-033). */
export function mergeSummaries(a: SOSDispatchSummary, b: SOSDispatchSummary): SOSDispatchSummary {
  return {
    nearbyRiders: a.nearbyRiders + b.nearbyRiders,
    serviceProviders: a.serviceProviders + b.serviceProviders,
    emergencyContacts: a.emergencyContacts + b.emergencyContacts,
    emergencyServices: a.emergencyServices + b.emergencyServices,
    smsAttempted: a.smsAttempted + b.smsAttempted,
    smsSent: a.smsSent + b.smsSent,
    whatsappAttempted: a.whatsappAttempted + b.whatsappAttempted,
    whatsappSent: a.whatsappSent + b.whatsappSent,
    emailAttempted: a.emailAttempted + b.emailAttempted,
    emailSent: a.emailSent + b.emailSent,
    inAppNotified: a.inAppNotified + b.inAppNotified,
    escalatedToAdmins: a.escalatedToAdmins + b.escalatedToAdmins,
    whatsappClickToSend: [...a.whatsappClickToSend, ...b.whatsappClickToSend],
    errors: [...a.errors, ...b.errors],
    channels: a.channels ?? b.channels,
  };
}

/**
 * The "always fire immediately" leg of SOS dispatch: the reporter's emergency contacts,
 * optional env-configured emergency-services contact, the reporter's own in-app confirmation,
 * and an email receipt. Nearby riders / service providers are no longer resolved here — they're
 * the staged escalation engine's job now (escalation.application.ts), reached tier by tier
 * instead of blasted all at once (ADR-033). Zero-recipient admin escalation also moved out of
 * this function — sos.application.ts's createAlert decides that after seeing BOTH this leg's
 * and tier-1's results, so the "never silently reach nobody" guarantee still holds.
 *
 * Channels go through communications ports/adapters — business policy never names Twilio/Meta/SMTP.
 */
export function createFanOutApplication(ports: SafetyLocationPorts) {
  return {
    // Idempotency is the orchestrator's responsibility now (dispatch.application.ts) — it has
    // to span this leg AND escalation.seedEscalation's tier-1 leg together, since both run on
    // every alert creation and a retried request must not double-notify either one.
    async fanOut(alert: RawSOSAlertDTO, deps: FanOutDeps = {}): Promise<SOSDispatchSummary> {
      const communications = deps.communications ?? ports.communications;
      const availability = resolveChannelAvailability(communications);
      const [emergencyContacts, emergencyServices] = await Promise.all([
        resolveEmergencyContacts(alert.userId, ports),
        Promise.resolve(resolveEmergencyServices()),
      ]);

      const summary: SOSDispatchSummary = {
        ...emptySummary(availability),
        emergencyContacts: emergencyContacts.length,
        emergencyServices: emergencyServices.length,
      };

      const recipients = [...emergencyContacts, ...emergencyServices];

      if (availability.email && alert.userEmail && !alert.userEmail.endsWith("@bikie.local")) {
        summary.emailAttempted += 1;
        const receipt = await communications.email
          .send({
            to: alert.userEmail,
            subject: `BIKIE SOS sent: ${alert.type} in ${alert.city}`,
            html: `<h2>Your SOS was sent</h2>
               ${buildEmailHtml(alert, { role: "NEARBY_RIDER", name: alert.userName })}
               <p>Notified: ${emergencyContacts.length} emergency contacts. Nearby riders are being
               alerted in stages — check Dashboard → SOS for live updates.</p>`,
          })
          .catch((e) => ({ ok: false, provider: "smtp" as const, error: String(e) }));
        if (receipt.ok) summary.emailSent += 1;
        else if (receipt.provider !== "dev") summary.errors.push(`email → ${alert.userEmail}: ${receipt.error}`);
      }

      // ADR-085 — SMS runs sequentially (one recipient at a time, its own loop) alongside, not
      // inside, the parallel WhatsApp/email/in-app dispatch below — the two channels sets don't
      // overlap (SMS moved out of `dispatchToRecipient` entirely) so running them concurrently
      // with each other is safe and doesn't slow either one down waiting on the other.
      await Promise.all([
        sendSosSmsSequentially(alert, recipients, communications, availability, summary),
        Promise.all(recipients.map((r) => dispatchToRecipient(alert, r, summary, communications, ports, availability))),
      ]);

      console.log(
        `[SOS][DISPATCH][CONTACTS] alert=${alert.id} contacts=${summary.emergencyContacts} ` +
          `sms=${summary.smsSent}/${summary.smsAttempted} wa=${summary.whatsappSent}/${summary.whatsappAttempted} ` +
          `email=${summary.emailSent}/${summary.emailAttempted}`,
      );
      for (const failure of summary.errors) console.error(`[SOS][DISPATCH][ERROR] ${failure}`);
      for (const link of summary.whatsappClickToSend) {
        console.log(`[SOS][DISPATCH][WA-LINK] ${link.name} ${link.phone} ${link.url}`);
      }

      return summary;
    },
  };
}

export type FanOutApplication = ReturnType<typeof createFanOutApplication>;
