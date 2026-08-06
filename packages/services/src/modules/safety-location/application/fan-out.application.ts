import type { SOSAlertDTO } from "@bikie/types";
import { toE164Phone } from "../../communications/domain/phone";
import { whatsappShareUrl, type CommunicationsPorts } from "../../communications/public";
import type { IdempotencyPort } from "../../platform/public";
import { alertKind } from "../domain/alert-kind";
import {
  channelsForRecipient,
  resolveChannelAvailability,
  type ChannelAvailability,
} from "../domain/channel-selection";
import { buildEmailHtml, buildTextBody, describeLocation, type SOSRecipient } from "../domain/dispatch-message";
import { formatDistance, mapsNavigateUrl } from "../domain/maps";
import type { SafetyLocationPorts } from "../ports";

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
  alert: SOSAlertDTO,
  recipient: SOSRecipient,
  summary: SOSDispatchSummary,
  communications: CommunicationsPorts,
  ports: SafetyLocationPorts,
  availability: ChannelAvailability,
) {
  const channels = channelsForRecipient(recipient, availability);
  const text = buildTextBody(alert, recipient);
  const navigate = mapsNavigateUrl(alert.latitude, alert.longitude);
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

    if (channels.sms) {
      summary.smsAttempted += 1;
      tasks.push(
        communications.sms
          .send(phone, text)
          .then((r) => {
            if (record("sms", phone, r)) summary.smsSent += 1;
          })
          .catch((e) => {
            summary.errors.push(`sms → ${phone}: ${String(e)}`);
          }),
      );
    }

    if (channels.whatsapp) {
      summary.whatsappAttempted += 1;
      tasks.push(
        communications.whatsapp
          .send(phone, text)
          .then(async (r) => {
            if (record("whatsapp", phone, r)) {
              summary.whatsappSent += 1;
              await communications.whatsapp
                .sendLocation(phone, {
                  latitude: alert.latitude,
                  longitude: alert.longitude,
                  name: `${alert.userName} — SOS`,
                  address: alert.city,
                })
                .catch(() => undefined);
            } else if (r.provider === "dev") {
              summary.whatsappClickToSend.push({
                name: recipient.name,
                phone,
                url: whatsappShareUrl(phone, text),
              });
            }
          })
          .catch((e) => {
            summary.errors.push(`whatsapp → ${phone}: ${String(e)}`);
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
          html: buildEmailHtml(alert, recipient),
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
    const kind = alertKind(alert.description);
    const distanceBit = distance ? ` You are ~${distance.replace(" away", "")} away.` : "";
    tasks.push(
      ports.notifications
        .notify(
          recipient.userId,
          "SOS_ALERT",
          kind === "RED" ? "Red Alert nearby" : kind === "AMBER" ? "Amber Alert nearby" : "SOS Alert nearby",
          `${alert.userName} needs help at ${describeLocation(alert)}.${distanceBit} Open Maps to navigate & see your distance: ${navigate}`,
          "sos_alert",
          alert.id,
        )
        .catch(console.error),
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
    async fanOut(alert: SOSAlertDTO, deps: FanOutDeps = {}): Promise<SOSDispatchSummary> {
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

      await Promise.all(
        recipients.map((r) => dispatchToRecipient(alert, r, summary, communications, ports, availability)),
      );

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
