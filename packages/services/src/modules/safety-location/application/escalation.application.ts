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
// Shorter window before falling through to the general population — community members get
// first crack, not the only crack (ADR-033 Phase D).
const communityTierTimeoutMs = () => Number(process.env.SOS_COMMUNITY_TIER_TIMEOUT_SECONDS ?? "120") * 1000;

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
   * Called once, right after alert creation. If any nearby rider shares a Community/Club with
   * the reporter (`CommunityMembershipPort`, ADR-033 Phase D), tier starts at
   * NEARBY_RIDERS_COMMUNITY and notifies only that subset, on a shorter timeout — everyone else
   * nearby is reached once the tier advances to NEARBY_RIDERS_GENERAL, not left out. Otherwise
   * tier starts at NEARBY_RIDERS_GENERAL exactly as before Phase D. Returns the tier-1 summary
   * AND the *total* nearby-rider count found (not just who was notified this round) so the
   * caller (sos.application.ts's createAlert) can fold zero-recipient detection across this leg
   * together with the emergency-contacts leg, before deciding whether to escalate to admin
   * immediately (ADR-030's guarantee, preserved even though the search is now staged).
   */
  async function seedEscalation(
    alert: SOSAlertDTO,
    deps: EscalationDeps = {},
  ): Promise<{ summary: SOSDispatchSummary; nearbyRiderCount: number }> {
    const communications = deps.communications ?? ports.communications;
    const availability = resolveChannelAvailability(communications);

    const nearby = await resolveNearbyRiders(alert, ports, INITIAL_RADIUS_METERS);
    const nearbyUserIds = nearby.filter((r): r is SOSRecipient & { userId: string } => Boolean(r.userId)).map((r) => r.userId);
    const communityIds = nearbyUserIds.length > 0
      ? await ports.community.findSharedGroupMemberIds(alert.userId, nearbyUserIds).catch(() => new Set<string>())
      : new Set<string>();

    const tier: "NEARBY_RIDERS_COMMUNITY" | "NEARBY_RIDERS_GENERAL" =
      communityIds.size > 0 ? "NEARBY_RIDERS_COMMUNITY" : "NEARBY_RIDERS_GENERAL";
    const toNotify = tier === "NEARBY_RIDERS_COMMUNITY" ? nearby.filter((r) => r.userId && communityIds.has(r.userId)) : nearby;
    const timeoutMs = tier === "NEARBY_RIDERS_COMMUNITY" ? communityTierTimeoutMs() : tierTimeoutMs();

    const summary = await notifyRecipients(alert, toNotify, ports, communications, availability);
    summary.nearbyRiders = toNotify.length;

    for (const r of toNotify) {
      if (r.userId) await ports.sosTimeline.record({ alertId: alert.id, type: "HELPER_OFFERED", metadata: { candidateId: r.userId, tier } }).catch(() => undefined);
    }

    await ports.sosAlerts.updateEscalationState(alert.id, {
      escalationTier: tier,
      currentRadiusMeters: INITIAL_RADIUS_METERS,
      nextEscalationAt: new Date(Date.now() + timeoutMs),
    });

    console.log(
      `[SOS][ESCALATE][SEED] alert=${alert.id} tier=${tier} radius=${INITIAL_RADIUS_METERS}m ` +
        `notified=${toNotify.length} totalNearby=${nearby.length}`,
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

    // COMMUNITY is a one-shot window, not its own radius-widening cycle — once it times out,
    // advance straight to GENERAL and notify the full nearby pool, minus whoever community
    // already reached (de-duped via the same Notification-table lookup radius-widening uses).
    if (alert.escalationTier === "NEARBY_RIDERS_COMMUNITY") {
      const [nearby, alreadyNotified] = await Promise.all([
        resolveNearbyRiders(alert, ports, INITIAL_RADIUS_METERS),
        ports.sosAlerts.findNotifiedUserIdsForAlert(alert.id),
      ]);
      const fresh = nearby.filter((r) => !r.userId || !alreadyNotified.has(r.userId));
      const summary = await notifyRecipients(alert, fresh, ports, communications, availability);
      await ports.sosTimeline.record({
        alertId: alert.id,
        type: "RADIUS_EXPANDED", // community-only pool -> full nearby pool; closest existing event type
        metadata: { tier: "NEARBY_RIDERS_GENERAL", notified: fresh.length },
      });
      await ports.sosAlerts.updateEscalationState(alert.id, {
        escalationTier: "NEARBY_RIDERS_GENERAL",
        currentRadiusMeters: INITIAL_RADIUS_METERS,
        nextEscalationAt: new Date(Date.now() + tierTimeoutMs()),
      });
      console.log(
        `[SOS][ESCALATE][TIER] alert=${alert.id} tier=NEARBY_RIDERS_GENERAL (from COMMUNITY) notified=${fresh.length} ` +
          `sms=${summary.smsSent}/${summary.smsAttempted}`,
      );
      return;
    }

    const isRiderTier = alert.escalationTier === "NEARBY_RIDERS_GENERAL";

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
