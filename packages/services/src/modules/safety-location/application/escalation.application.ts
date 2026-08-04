import type { SOSAlertDTO } from "@bikie/types";
import { resolveChannelAvailability, type ChannelAvailability } from "../domain/channel-selection";
import type { CommunicationsPorts } from "../../communications/public";
import { partnerTypeForAlertType } from "../domain/partner-mapping";
import type { SOSRecipient } from "../domain/dispatch-message";
import type { SafetyLocationPorts } from "../ports";
import { dispatchToRecipient, emptySummary, type SOSDispatchSummary } from "./fan-out.application";

const INITIAL_RADIUS_METERS = 5000;
const radiusStepMeters = () => Number(process.env.SOS_RADIUS_STEP_KM ?? "5") * 1000;
const radiusMaxMeters = () => Number(process.env.SOS_RADIUS_MAX_KM ?? "20") * 1000;
const tierTimeoutMs = () => Number(process.env.SOS_TIER_TIMEOUT_SECONDS ?? "300") * 1000;

const TIER_ORDER = ["NEARBY_RIDERS_COMMUNITY", "NEARBY_RIDERS_GENERAL", "SERVICE_PROVIDERS", "ADMIN"] as const;
type Tier = (typeof TIER_ORDER)[number];

function nextTier(tier: string): Tier | null {
  const index = TIER_ORDER.indexOf(tier as Tier);
  if (index === -1 || index === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[index + 1];
}

async function resolveNearbyRiders(
  alert: Pick<SOSAlertDTO, "latitude" | "longitude" | "userId">,
  ports: SafetyLocationPorts,
  radiusMeters: number,
): Promise<SOSRecipient[]> {
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
  alert: Pick<SOSAlertDTO, "city" | "type">,
  ports: SafetyLocationPorts,
): Promise<SOSRecipient[]> {
  const relevantType = partnerTypeForAlertType(alert.type);
  const verified = await ports.partnerDispatch.findByCity(alert.city, 25, {
    type: relevantType,
    verifiedOnly: true,
  });
  // Better to reach an unverified/general-type partner than nobody — broaden if the strict
  // (verified + type-matched) search comes up empty.
  const pool = verified.length > 0 ? verified : await ports.partnerDispatch.findByCity(alert.city);

  const recipients: SOSRecipient[] = [];
  for (const p of pool) {
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
  }
  return recipients;
}

async function notifyRecipients(
  alert: SOSAlertDTO,
  recipients: SOSRecipient[],
  ports: SafetyLocationPorts,
  communications: CommunicationsPorts,
  availability: ChannelAvailability,
): Promise<SOSDispatchSummary> {
  const summary = emptySummary(availability);
  await Promise.all(recipients.map((r) => dispatchToRecipient(alert, r, summary, communications, ports, availability)));
  return summary;
}

export type EscalationDeps = { communications?: CommunicationsPorts };

export function createEscalationApplication(ports: SafetyLocationPorts) {
  /**
   * Called once, right after alert creation. Notifies tier-1 (nearby riders, general — the
   * community tier is reserved but not yet activated, see ADR-033 Phase D) and schedules the
   * first escalation tick. Returns the tier-1 summary AND the raw nearby-rider count so the
   * caller (sos.application.ts's createAlert) can fold zero-recipient detection across this
   * leg together with the emergency-contacts leg, before deciding whether to escalate to admin
   * immediately (ADR-030's guarantee, preserved even though the search is now staged).
   */
  async function seedEscalation(
    alert: SOSAlertDTO,
    deps: EscalationDeps = {},
  ): Promise<{ summary: SOSDispatchSummary; nearbyRiderCount: number }> {
    const communications = deps.communications ?? ports.communications;
    const availability = resolveChannelAvailability(communications);

    const nearby = await resolveNearbyRiders(alert, ports, INITIAL_RADIUS_METERS);
    const summary = await notifyRecipients(alert, nearby, ports, communications, availability);
    summary.nearbyRiders = nearby.length;

    for (const r of nearby) {
      if (r.userId) await ports.sosTimeline.record({ alertId: alert.id, type: "HELPER_OFFERED", metadata: { candidateId: r.userId, tier: "NEARBY_RIDERS_GENERAL" } }).catch(() => undefined);
    }

    await ports.sosAlerts.updateEscalationState(alert.id, {
      currentRadiusMeters: INITIAL_RADIUS_METERS,
      nextEscalationAt: new Date(Date.now() + tierTimeoutMs()),
    });

    console.log(
      `[SOS][ESCALATE][SEED] alert=${alert.id} tier=NEARBY_RIDERS_GENERAL radius=${INITIAL_RADIUS_METERS}m notified=${nearby.length}`,
    );

    return { summary, nearbyRiderCount: nearby.length };
  }

  /** One cron-poll step for one alert that's due (GET /api/cron/sos-escalate). */
  async function tickEscalation(alert: SOSAlertDTO, deps: EscalationDeps = {}): Promise<void> {
    if (alert.assignedHelperId) {
      // Race between the cron query and processing — defensive no-op.
      await ports.sosAlerts.updateEscalationState(alert.id, { nextEscalationAt: null });
      return;
    }

    const communications = deps.communications ?? ports.communications;
    const availability = resolveChannelAvailability(communications);
    const isRiderTier = alert.escalationTier === "NEARBY_RIDERS_GENERAL" || alert.escalationTier === "NEARBY_RIDERS_COMMUNITY";

    if (isRiderTier && alert.currentRadiusMeters < radiusMaxMeters()) {
      const widened = Math.min(alert.currentRadiusMeters + radiusStepMeters(), radiusMaxMeters());
      const [nearby, alreadyNotified] = await Promise.all([
        resolveNearbyRiders(alert, ports, widened),
        ports.sosAlerts.findNotifiedUserIdsForAlert(alert.id),
      ]);
      const fresh = nearby.filter((r) => r.userId && !alreadyNotified.has(r.userId));

      const summary = await notifyRecipients(alert, fresh, ports, communications, availability);
      await ports.sosTimeline.record({
        alertId: alert.id,
        type: "RADIUS_EXPANDED",
        metadata: { fromMeters: alert.currentRadiusMeters, toMeters: widened, newlyNotified: fresh.length },
      });
      await ports.sosAlerts.updateEscalationState(alert.id, {
        currentRadiusMeters: widened,
        nextEscalationAt: new Date(Date.now() + tierTimeoutMs()),
      });
      console.log(
        `[SOS][ESCALATE][RADIUS] alert=${alert.id} tier=${alert.escalationTier} radius=${widened}m ` +
          `newlyNotified=${fresh.length} sms=${summary.smsSent}/${summary.smsAttempted}`,
      );
      return;
    }

    const advanceTo = nextTier(alert.escalationTier);
    if (!advanceTo) {
      // Already at the terminal ADMIN tier with no assignment — nothing further to do.
      await ports.sosAlerts.updateEscalationState(alert.id, { nextEscalationAt: null });
      return;
    }

    if (advanceTo === "SERVICE_PROVIDERS") {
      const providers = await resolveServiceProviders(alert, ports);
      const summary = await notifyRecipients(alert, providers, ports, communications, availability);
      await ports.sosTimeline.record({
        alertId: alert.id,
        type: "ESCALATED_SERVICE_PROVIDERS",
        metadata: { notified: providers.length },
      });
      await ports.sosAlerts.updateEscalationState(alert.id, {
        escalationTier: "SERVICE_PROVIDERS",
        currentRadiusMeters: INITIAL_RADIUS_METERS,
        nextEscalationAt: new Date(Date.now() + tierTimeoutMs()),
      });
      console.log(
        `[SOS][ESCALATE][TIER] alert=${alert.id} tier=SERVICE_PROVIDERS notified=${providers.length} ` +
          `sms=${summary.smsSent}/${summary.smsAttempted}`,
      );
      return;
    }

    // advanceTo === "ADMIN" — terminal tier, matches ADR-030's original escalation behavior.
    const admins = await ports.escalation.findAdminContacts().catch(() => []);
    const adminRecipients: SOSRecipient[] = admins.map((a) => ({
      role: "PLATFORM_ADMIN" as const,
      name: a.name,
      phone: a.phone,
      email: a.email,
      userId: a.id,
    }));
    const summary = await notifyRecipients(alert, adminRecipients, ports, communications, availability);
    await ports.sosTimeline.record({ alertId: alert.id, type: "ESCALATED_ADMIN", metadata: { notified: admins.length } });
    await ports.sosAlerts.updateEscalationState(alert.id, { escalationTier: "ADMIN", nextEscalationAt: null });
    console.log(
      `[SOS][ESCALATE][TIER] alert=${alert.id} tier=ADMIN notified=${admins.length} sms=${summary.smsSent}/${summary.smsAttempted}`,
    );
  }

  return { seedEscalation, tickEscalation, resolveEscalationServiceProviders: resolveServiceProviders };
}

export type EscalationApplication = ReturnType<typeof createEscalationApplication>;
