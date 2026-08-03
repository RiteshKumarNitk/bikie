import type { SOSAlertDTO } from "@bikie/types";
import { toE164Phone } from "../../communications/domain/phone";
import { whatsappShareUrl, type CommunicationsPorts } from "../../communications/public";
import { getPlatformModule, type IdempotencyPort } from "../../platform/public";
import { alertKind } from "../domain/alert-kind";
import {
  channelsForRecipient,
  resolveChannelAvailability,
  type ChannelAvailability,
} from "../domain/channel-selection";
import { buildEmailHtml, buildTextBody, type SOSRecipient } from "../domain/dispatch-message";
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

function emptySummary(channels: ChannelAvailability): SOSDispatchSummary {
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

const SOS_DISPATCH_IDEMPOTENCY_TTL_SECONDS = 86_400;

async function resolveNearbyRiders(
  alert: SOSAlertDTO,
  ports: SafetyLocationPorts,
): Promise<SOSRecipient[]> {
  const radiusKm = Number(process.env.SOS_NEARBY_RADIUS_KM ?? "10");
  const radiusMeters = (Number.isFinite(radiusKm) ? radiusKm : 10) * 1000;
  const rows = await ports.riderLocation.findNearbyAroundPoint(
    alert.latitude,
    alert.longitude,
    alert.userId,
    radiusMeters,
  );
  return rows.map((r) => ({
    role: "NEARBY_RIDER" as const,
    name: r.name,
    phone: r.phone,
    email: r.email,
    userId: r.id,
    distanceMeters: Math.round(r.distanceMeters),
  }));
}

async function resolveServiceProviders(
  alert: SOSAlertDTO,
  ports: SafetyLocationPorts,
): Promise<SOSRecipient[]> {
  const partners = await ports.partnerDispatch.findByCity(alert.city);

  const recipients: SOSRecipient[] = [];
  for (const p of partners) {
    recipients.push({
      role: "SERVICE_PROVIDER",
      name: p.businessName || p.user.name,
      phone: p.user.phone ?? p.contactPerson1Mobile,
      email: p.user.email,
      userId: p.userId,
    });
    if (p.contactPerson1Mobile && p.contactPerson1Mobile !== p.user.phone) {
      recipients.push({
        role: "SERVICE_PROVIDER",
        name: p.contactPerson1Name ?? `${p.businessName} contact`,
        phone: p.contactPerson1Mobile,
        email: null,
      });
    }
    if (p.contactPerson2Mobile) {
      recipients.push({
        role: "SERVICE_PROVIDER",
        name: p.contactPerson2Name ?? `${p.businessName} contact 2`,
        phone: p.contactPerson2Mobile,
        email: null,
      });
    }
  }
  return recipients;
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
 * while nobody is told. Escalate to platform admins so someone always picks it up (ADR-030).
 */
async function resolveEscalationRecipients(ports: SafetyLocationPorts): Promise<SOSRecipient[]> {
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

async function dispatchToRecipient(
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
          `${alert.userName} needs help in ${alert.city}.${distanceBit} Open Maps to navigate & see your distance: ${navigate}`,
          "sos_alert",
          alert.id,
        )
        .catch(console.error),
    );
  }

  await Promise.all(tasks);
}

/**
 * Fan-out after an SOS alert is persisted: SMS + WhatsApp + email (and in-app/push where the
 * recipient is a platform user) to nearby riders, same-city service providers, the reporter's
 * emergency contacts, and optional emergency-services numbers from env.
 *
 * Channels go through communications ports/adapters — business policy never names Twilio/Meta/SMTP.
 */
export function createFanOutApplication(ports: SafetyLocationPorts) {
  return {
    async fanOut(alert: SOSAlertDTO, deps: FanOutDeps = {}): Promise<SOSDispatchSummary> {
      const communications = deps.communications ?? ports.communications;
      const idempotency = deps.idempotency ?? getPlatformModule().ports.idempotency;
      const idemKey = `sos-dispatch:${alert.id}`;

      const claimed = await idempotency.claim(idemKey, SOS_DISPATCH_IDEMPOTENCY_TTL_SECONDS);
      if (!claimed) {
        const cached = await idempotency.recall<SOSDispatchSummary>(idemKey);
        if (cached) return cached;
        // In-flight duplicate — skip side effects; return an empty accounting summary.
        return emptySummary(resolveChannelAvailability(communications));
      }

      const availability = resolveChannelAvailability(communications);
      const [nearbyRiders, serviceProviders, emergencyContacts, emergencyServices] = await Promise.all([
        resolveNearbyRiders(alert, ports),
        resolveServiceProviders(alert, ports),
        resolveEmergencyContacts(alert.userId, ports),
        Promise.resolve(resolveEmergencyServices()),
      ]);

      const summary: SOSDispatchSummary = {
        ...emptySummary(availability),
        nearbyRiders: nearbyRiders.length,
        serviceProviders: serviceProviders.length,
        emergencyContacts: emergencyContacts.length,
        emergencyServices: emergencyServices.length,
      };

      const recipients = [...nearbyRiders, ...serviceProviders, ...emergencyContacts, ...emergencyServices];

      const respondersFound = recipients.length;

      if (respondersFound === 0) {
        const admins = await resolveEscalationRecipients(ports);
        summary.escalatedToAdmins = admins.length;
        recipients.push(...admins);
        console.error(
          `[SOS][DISPATCH][NO-RECIPIENTS] alert=${alert.id} city=${alert.city} — no nearby riders, ` +
            `providers, or emergency contacts; escalated to ${admins.length} admin(s).`,
        );
      }

      // The reporter always gets an in-app confirmation, even with no channels configured and
      // nobody nearby — otherwise the only feedback they get is a success screen that lies.
      await ports.notifications
        .notify(
          alert.userId,
          "SOS_ALERT",
          "Your SOS alert is live",
          respondersFound > 0
            ? `Alerting ${respondersFound} responder(s) in ${alert.city}. Track responses in Dashboard → SOS.`
            : `No responders could be reached in ${alert.city}. Add emergency contacts in your profile and call local emergency services now.`,
          "sos_alert",
          alert.id,
        )
        .catch(console.error);

      if (availability.email && alert.userEmail && !alert.userEmail.endsWith("@bikie.local")) {
        summary.emailAttempted += 1;
        const receipt = await communications.email
          .send({
            to: alert.userEmail,
            subject: `BIKIE SOS sent: ${alert.type} in ${alert.city}`,
            html: `<h2>Your SOS was sent</h2>
               ${buildEmailHtml(alert, { role: "NEARBY_RIDER", name: alert.userName })}
               <p>Notified: ${nearbyRiders.length} nearby riders, ${serviceProviders.length} providers,
               ${emergencyContacts.length} emergency contacts.</p>`,
          })
          .catch((e) => ({ ok: false, provider: "smtp" as const, error: String(e) }));
        if (receipt.ok) summary.emailSent += 1;
        else if (receipt.provider !== "dev") summary.errors.push(`email → ${alert.userEmail}: ${receipt.error}`);
      }

      await Promise.all(
        recipients.map((r) => dispatchToRecipient(alert, r, summary, communications, ports, availability)),
      );

      console.log(
        `[SOS][DISPATCH] alert=${alert.id} nearby=${summary.nearbyRiders} providers=${summary.serviceProviders} ` +
          `contacts=${summary.emergencyContacts} sms=${summary.smsSent}/${summary.smsAttempted} ` +
          `wa=${summary.whatsappSent}/${summary.whatsappAttempted} email=${summary.emailSent}/${summary.emailAttempted} ` +
          `inApp=${summary.inAppNotified} admins=${summary.escalatedToAdmins} ` +
          `channels=sms:${availability.sms ? "on" : "off"},wa:${availability.whatsapp ? "on" : "off"},email:${availability.email ? "on" : "off"}`,
      );
      for (const failure of summary.errors) console.error(`[SOS][DISPATCH][ERROR] ${failure}`);
      for (const link of summary.whatsappClickToSend) {
        console.log(`[SOS][DISPATCH][WA-LINK] ${link.name} ${link.phone} ${link.url}`);
      }

      await idempotency.remember(idemKey, summary, SOS_DISPATCH_IDEMPOTENCY_TTL_SECONDS);
      return summary;
    },
  };
}

export type FanOutApplication = ReturnType<typeof createFanOutApplication>;
