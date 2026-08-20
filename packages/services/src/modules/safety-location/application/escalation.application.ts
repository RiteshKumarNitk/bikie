import { resolveChannelAvailability, type ChannelAvailability } from "../domain/channel-selection";
import type { CommunicationsPorts } from "../../communications/public";
import { partnerMatchesAlertType } from "../domain/partner-mapping";
import type { SOSRecipient } from "../domain/dispatch-message";
import type { RawSOSAlertDTO, SafetyLocationPorts } from "../ports";
import { dispatchToRecipient, emptySummary, markSmsEligibility, type SOSDispatchSummary } from "./fan-out.application";

const INITIAL_RADIUS_METERS = 5000;
const radiusStepMeters = () => Number(process.env.SOS_RADIUS_STEP_KM ?? "5") * 1000;
const radiusMaxMeters = () => Number(process.env.SOS_RADIUS_MAX_KM ?? "20") * 1000;
const tierTimeoutMs = () => Number(process.env.SOS_TIER_TIMEOUT_SECONDS ?? "300") * 1000;
// Shorter window before falling through to the general population — community members get
// first crack, not the only crack (ADR-033 Phase D).
const communityTierTimeoutMs = () => Number(process.env.SOS_COMMUNITY_TIER_TIMEOUT_SECONDS ?? "120") * 1000;

// ADR-047: Service Providers are no longer a later-tier fallback reached only after Nearby
// Riders are fully exhausted — they're dispatched together with riders at every radius step,
// widening in lockstep (see `resolveServiceProviders`'s `radiusMeters` param below). `ADMIN`
// remains the sole terminal tier once radius is maxed and nobody — rider or provider — has
// accepted. `SERVICE_PROVIDERS` stays a valid `SOSEscalationTier` enum value (unused going
// forward, harmless to leave — dropping a Postgres enum value needs a migration for zero gain)
// but is never assigned by this module anymore.
const TIER_ORDER = ["NEARBY_RIDERS_COMMUNITY", "NEARBY_RIDERS_GENERAL", "ADMIN"] as const;
type Tier = (typeof TIER_ORDER)[number];

function nextTier(tier: string): Tier | null {
  const index = TIER_ORDER.indexOf(tier as Tier);
  if (index === -1 || index === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[index + 1];
}

async function resolveNearbyRiders(
  alert: Pick<RawSOSAlertDTO, "latitude" | "longitude" | "userId">,
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

/**
 * Which verified, available partners get dispatched an SOS (ADR-044, ordering corrected by
 * ADR-047). Used to broaden to *every* partner type (even unverified) whenever the strict
 * verified+type-matched search came up empty ("better to reach someone than nobody") — that's
 * exactly why a fuel-delivery partner could receive a medical emergency. Replaced with real
 * eligibility: a radius around the alert (shared with, and widening in lockstep with, the
 * nearby-rider search — see the `radiusMeters` param), verified + available + geotagged
 * (`findEligibleForAlert`), category-matched (`partnerMatchesAlertType` — an unmapped category
 * like MEDICAL only reaches partners who've explicitly opted in as a general responder), and not
 * already at capacity (`findActiveHelperUserIds`, the concurrency cap). No fallback that reaches
 * an ineligible partner "better than nobody" — `tickEscalation` still advances to ADMIN
 * unconditionally once radius is maxed with no acceptance, so the "SOS must never reach nobody"
 * guarantee (ADR-030) holds without one.
 */
async function resolveServiceProviders(
  alert: Pick<RawSOSAlertDTO, "latitude" | "longitude" | "type">,
  ports: SafetyLocationPorts,
  radiusMeters: number,
  /** Partners already notified on an earlier, smaller radius this same alert — excluded here so
   * a widening tick doesn't re-dispatch them (and, for the ones with a secondary contact-person
   * phone that has no `userId` of its own to dedupe by, doesn't re-SMS that number on every
   * subsequent tick either — dedup happens on the partner's account, before recipients are
   * built, not on the generated recipient rows). */
  excludeUserIds: Set<string> = new Set(),
): Promise<SOSRecipient[]> {
  const candidates = await ports.partnerDispatch.findEligibleForAlert({
    latitude: alert.latitude,
    longitude: alert.longitude,
    radiusMeters,
  });
  const typeMatched = candidates.filter(
    (c) => partnerMatchesAlertType(c, alert.type) && !excludeUserIds.has(c.userId),
  );
  if (typeMatched.length === 0) return [];

  const atCapacity = await ports.sosSessions.findActiveHelperUserIds(typeMatched.map((c) => c.userId));
  const eligible = typeMatched.filter((c) => !atCapacity.has(c.userId));

  const recipients: SOSRecipient[] = [];
  for (const p of eligible) {
    recipients.push({
      role: "SERVICE_PROVIDER",
      name: p.businessName || p.user.name,
      phone: p.user.phone ?? p.contactPerson1Mobile,
      email: p.user.email,
      userId: p.userId,
      distanceMeters: Math.round(p.distanceMeters),
    });
    if (p.contactPerson1Mobile && p.contactPerson1Mobile !== p.user.phone) {
      recipients.push({
        role: "SERVICE_PROVIDER",
        name: p.contactPerson1Name ?? `${p.businessName} contact`,
        phone: p.contactPerson1Mobile,
        email: null,
        distanceMeters: Math.round(p.distanceMeters),
      });
    }
  }
  return recipients;
}

async function notifyRecipients(
  alert: RawSOSAlertDTO,
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
   * the reporter (`CommunityMembershipPort`, ADR-033 Phase D), the rider tier starts at
   * NEARBY_RIDERS_COMMUNITY and notifies only that subset, on a shorter timeout — everyone else
   * nearby is reached once the tier advances to NEARBY_RIDERS_GENERAL, not left out. Otherwise
   * the rider tier starts at NEARBY_RIDERS_GENERAL exactly as before Phase D.
   *
   * ADR-047: eligible Service Providers are dispatched in this SAME round, at the same starting
   * radius, regardless of which rider tier was chosen — they're a parallel responder pool, not a
   * later fallback reached only once every rider tier has been exhausted (see `resolveServiceProviders`).
   *
   * Returns the tier-1 summary AND the *total* nearby-rider count found (not just who was
   * notified this round) so the caller (sos.application.ts's createAlert) can fold
   * zero-recipient detection across this leg together with the emergency-contacts leg, before
   * deciding whether to escalate to admin immediately (ADR-030's guarantee, preserved even
   * though the search is now staged).
   */
  async function seedEscalation(
    alert: RawSOSAlertDTO,
    deps: EscalationDeps = {},
  ): Promise<{ summary: SOSDispatchSummary; nearbyRiderCount: number }> {
    const communications = deps.communications ?? ports.communications;
    const availability = resolveChannelAvailability(communications);

    const [nearby, providers] = await Promise.all([
      resolveNearbyRiders(alert, ports, INITIAL_RADIUS_METERS),
      resolveServiceProviders(alert, ports, INITIAL_RADIUS_METERS),
    ]);
    const nearbyUserIds = nearby.filter((r): r is SOSRecipient & { userId: string } => Boolean(r.userId)).map((r) => r.userId);
    const communityIds = nearbyUserIds.length > 0
      ? await ports.community.findSharedGroupMemberIds(alert.userId, nearbyUserIds).catch(() => new Set<string>())
      : new Set<string>();

    const tier: "NEARBY_RIDERS_COMMUNITY" | "NEARBY_RIDERS_GENERAL" =
      communityIds.size > 0 ? "NEARBY_RIDERS_COMMUNITY" : "NEARBY_RIDERS_GENERAL";
    const ridersToNotify = tier === "NEARBY_RIDERS_COMMUNITY" ? nearby.filter((r) => r.userId && communityIds.has(r.userId)) : nearby;
    const timeoutMs = tier === "NEARBY_RIDERS_COMMUNITY" ? communityTierTimeoutMs() : tierTimeoutMs();
    // ADR-059 — caps the DLT "BIKIE_SR" SMS to the nearest 10 combined riders+providers in this
    // batch; in-app/WhatsApp/email still reach everyone in ridersToNotify/providers unchanged.
    const toNotify = markSmsEligibility([...ridersToNotify, ...providers]);

    const summary = await notifyRecipients(alert, toNotify, ports, communications, availability);
    summary.nearbyRiders = ridersToNotify.length;
    summary.serviceProviders = providers.length;

    for (const r of toNotify) {
      if (r.userId) await ports.sosTimeline.record({ alertId: alert.id, type: "HELPER_OFFERED", metadata: { candidateId: r.userId, role: r.role, tier } }).catch(() => undefined);
    }

    await ports.sosAlerts.updateEscalationState(alert.id, {
      escalationTier: tier,
      currentRadiusMeters: INITIAL_RADIUS_METERS,
      nextEscalationAt: new Date(Date.now() + timeoutMs),
    });

    console.log(
      `[SOS][ESCALATE][SEED] alert=${alert.id} tier=${tier} radius=${INITIAL_RADIUS_METERS}m ` +
        `ridersNotified=${ridersToNotify.length} providersNotified=${providers.length} totalNearby=${nearby.length}`,
    );

    return { summary, nearbyRiderCount: nearby.length };
  }

  /** One cron-poll step for one alert that's due (GET /api/cron/sos-escalate). */
  async function tickEscalation(alert: RawSOSAlertDTO, deps: EscalationDeps = {}): Promise<void> {
    // Atomic claim, re-verified straight against the DB (not the possibly-stale `alert` snapshot
    // findAlertsDueForEscalation returned) — see claimAlertForEscalation's doc comment. A false
    // return means another process already claimed this tick, the alert got assigned, or it's no
    // longer due; either way there's nothing left to do, including cleanup — whichever process
    // won already left the row in a correct state.
    const claimed = await ports.sosAlerts.claimAlertForEscalation(alert.id, new Date());
    if (!claimed) return;

    const communications = deps.communications ?? ports.communications;
    const availability = resolveChannelAvailability(communications);

    // COMMUNITY is a one-shot window, not its own radius-widening cycle — once it times out,
    // advance straight to GENERAL and notify the full nearby-rider pool, minus whoever community
    // already reached. Service Providers were already dispatched in `seedEscalation` at this same
    // starting radius (ADR-047) — re-resolved here too (deduped by `excludeUserIds`) only in case
    // one newly became eligible (e.g. toggled Available) since the alert was created; normally
    // this finds nothing new.
    if (alert.escalationTier === "NEARBY_RIDERS_COMMUNITY") {
      const alreadyNotified = await ports.sosAlerts.findNotifiedUserIdsForAlert(alert.id);
      const [nearby, providers] = await Promise.all([
        resolveNearbyRiders(alert, ports, INITIAL_RADIUS_METERS),
        resolveServiceProviders(alert, ports, INITIAL_RADIUS_METERS, alreadyNotified),
      ]);
      const freshRiders = nearby.filter((r) => !r.userId || !alreadyNotified.has(r.userId));
      const fresh = markSmsEligibility([...freshRiders, ...providers]); // ADR-059
      const summary = await notifyRecipients(alert, fresh, ports, communications, availability);
      await ports.sosTimeline.record({
        alertId: alert.id,
        type: "RADIUS_EXPANDED", // community-only pool -> full nearby pool; closest existing event type
        metadata: { tier: "NEARBY_RIDERS_GENERAL", notifiedRiders: freshRiders.length, notifiedProviders: providers.length },
      });
      await ports.sosAlerts.updateEscalationState(alert.id, {
        escalationTier: "NEARBY_RIDERS_GENERAL",
        currentRadiusMeters: INITIAL_RADIUS_METERS,
        nextEscalationAt: new Date(Date.now() + tierTimeoutMs()),
      });
      console.log(
        `[SOS][ESCALATE][TIER] alert=${alert.id} tier=NEARBY_RIDERS_GENERAL (from COMMUNITY) ` +
          `ridersNotified=${freshRiders.length} providersNotified=${providers.length} sms=${summary.smsSent}/${summary.smsAttempted}`,
      );
      return;
    }

    const isRiderTier = alert.escalationTier === "NEARBY_RIDERS_GENERAL";

    // ADR-047: riders and eligible Service Providers widen together, on the same radius ladder —
    // a provider is no longer a fallback reached only after riders exhaust every step.
    if (isRiderTier && alert.currentRadiusMeters < radiusMaxMeters()) {
      const widened = Math.min(alert.currentRadiusMeters + radiusStepMeters(), radiusMaxMeters());
      const alreadyNotified = await ports.sosAlerts.findNotifiedUserIdsForAlert(alert.id);
      const [nearby, providers] = await Promise.all([
        resolveNearbyRiders(alert, ports, widened),
        resolveServiceProviders(alert, ports, widened, alreadyNotified),
      ]);
      const freshRiders = nearby.filter((r) => r.userId && !alreadyNotified.has(r.userId));
      const fresh = markSmsEligibility([...freshRiders, ...providers]); // ADR-059

      const summary = await notifyRecipients(alert, fresh, ports, communications, availability);
      await ports.sosTimeline.record({
        alertId: alert.id,
        type: "RADIUS_EXPANDED",
        metadata: {
          fromMeters: alert.currentRadiusMeters,
          toMeters: widened,
          newlyNotifiedRiders: freshRiders.length,
          newlyNotifiedProviders: providers.length,
        },
      });
      await ports.sosAlerts.updateEscalationState(alert.id, {
        currentRadiusMeters: widened,
        nextEscalationAt: new Date(Date.now() + tierTimeoutMs()),
      });
      console.log(
        `[SOS][ESCALATE][RADIUS] alert=${alert.id} tier=${alert.escalationTier} radius=${widened}m ` +
          `newlyNotifiedRiders=${freshRiders.length} newlyNotifiedProviders=${providers.length} sms=${summary.smsSent}/${summary.smsAttempted}`,
      );
      return;
    }

    const advanceTo = nextTier(alert.escalationTier);
    if (!advanceTo) {
      // Already at the terminal ADMIN tier with no assignment — nothing further to do.
      await ports.sosAlerts.updateEscalationState(alert.id, { nextEscalationAt: null });
      return;
    }

    // advanceTo === "ADMIN" — terminal tier, reached once radius is maxed with neither a rider
    // nor a Service Provider having accepted (matches ADR-030's original escalation guarantee).
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
