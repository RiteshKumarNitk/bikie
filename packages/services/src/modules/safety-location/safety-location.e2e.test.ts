/**
 * Full-flow application-layer tests (ADR-045) — chains create → dispatch → offer → accept →
 * complete → resolve across multiple calls against one shared, stateful set of in-memory fakes,
 * instead of the single-function-at-a-time unit tests in safety-location.test.ts.
 *
 * Scope note: this repo has no Playwright/Cypress/browser-test harness anywhere (checked before
 * writing this file) — Vitest against mocked ports is the only test paradigm that exists here.
 * These tests prove the *application layer's* orchestration (eligibility, redaction, offer
 * lifecycle, escalation staging) is correct. They do NOT exercise the real Postgres transaction
 * `acceptOffer` runs in (`sos-session.repository.ts`) — that already-implemented race-safety
 * property would need a real-database integration test to verify independently, which nothing in
 * this repo currently supports. The "assignment locking" test below locks in the *contract*
 * (second accept sees ALREADY_ASSIGNED, losing offers flip to EXPIRED) using a fake that mirrors
 * what the real transaction does, not a test of the transaction itself.
 */
import { describe, expect, it, vi } from "vitest";

// Vitest only hoists/applies vi.mock(...) when called directly in the test file that needs it —
// every test file driving createSafetyLocationModule() needs its own copy of this (see
// safety-location.test-support.ts's doc comment for why these factories live in a plain .ts
// file instead of being imported from safety-location.test.ts directly).
vi.mock("@bikie/database", () => ({
  sosRepository: {},
  sosSessionRepository: { AlreadyAssignedError: class extends Error {}, OfferNotAvailableError: class extends Error {} },
  sosTimelineRepository: {},
  communityRepository: {},
  riderLocationRepository: {},
  partnerRepository: {},
  riderProfileRepository: {},
  userRepository: {},
  notificationRepository: {},
  reputationRepository: {
    recordAssist: vi.fn(async () => undefined),
    recordRating: vi.fn(async () => undefined),
    getStats: vi.fn(async () => null),
  },
}));

vi.mock("../../../notification.service", () => ({
  NotificationService: { notify: vi.fn(async () => undefined) },
}));

vi.mock("../../../lib/realtime", () => ({
  RealtimeService: { publishToUser: vi.fn(), publishGlobal: vi.fn() },
}));

vi.mock("../../../push.service", () => ({
  PushService: { sendToUser: vi.fn(async () => undefined) },
}));

import {
  AlreadyAssignedError,
  AlreadyOfferedError,
  OfferNotAvailableError,
  type RawSOSAlertDTO,
  type SafetyLocationPorts,
  type SosOfferRow,
  type SosSessionRow,
} from "./ports";
import { createSafetyLocationModule } from "./public";
import { emptyRepos, fakeCommunications, notifyMock, sampleAlert } from "./safety-location.test-support";

type SessionRow = SosSessionRow & {
  helper: { id: string; name: string; phone: string | null; email: string };
  rider: { id: string; name: string; phone: string | null; email: string };
};

/** A minimal, coherent in-memory "database" behind the ports SOS flows actually touch —
 * mirrors the real repositories' documented behavior closely enough to drive a multi-step flow
 * (see the module-level doc comment for what this does and does not prove). */
function createFakePorts(alertOverrides: Partial<RawSOSAlertDTO> = {}) {
  let alert: RawSOSAlertDTO = sampleAlert(alertOverrides);
  const offers = new Map<string, SosOfferRow & { status: string }>();
  let offerSeq = 0;
  let session: SessionRow | null = null;

  function responderRow(responderId: string) {
    return { id: responderId, name: `Responder ${responderId}`, phone: "9000000000", email: `${responderId}@example.com` };
  }

  const sosAlerts: SafetyLocationPorts["sosAlerts"] = {
    ...(emptyRepos().sosAlerts as SafetyLocationPorts["sosAlerts"]),
    createAlert: vi.fn(async () => alert),
    getAlertById: vi.fn(async (id: string) => (id === alert.id ? { ...alert } : null)),
    getActiveAlerts: vi.fn(async () => (alert.status === "ACTIVE" ? [{ ...alert }] : [])),
    getOpenAlertsNearPoint: vi.fn(async () =>
      alert.status === "ACTIVE" && !alert.assignedHelperId ? [{ ...alert }] : [],
    ),
    resolveAlert: vi.fn(async () => {
      alert = { ...alert, status: "RESOLVED" };
    }),
  };

  const sosOffers: SafetyLocationPorts["sosOffers"] = {
    createOffer: vi.fn(async (params) => {
      if ([...offers.values()].some((o) => o.responderId === params.responderId && o.alertId === params.alertId)) {
        throw new AlreadyOfferedError("You've already offered to help with this alert");
      }
      offerSeq += 1;
      const row = {
        id: `offer-${offerSeq}`,
        alertId: params.alertId,
        responderId: params.responderId,
        responder: responderRow(params.responderId),
        status: "OFFERED",
        distanceMeters: params.distanceMeters ?? null,
        etaMinutes: params.etaMinutes ?? null,
        message: params.message ?? null,
        createdAt: new Date(),
      };
      offers.set(row.id, row);
      return row;
    }),
    declineAlert: vi.fn(async (params) => {
      if ([...offers.values()].some((o) => o.responderId === params.responderId && o.alertId === params.alertId)) {
        throw new AlreadyOfferedError("You've already responded to this alert");
      }
      offerSeq += 1;
      const row = {
        id: `decline-${offerSeq}`,
        alertId: params.alertId,
        responderId: params.responderId,
        responder: responderRow(params.responderId),
        status: "DECLINED",
        distanceMeters: null,
        etaMinutes: null,
        message: params.message ?? null,
        createdAt: new Date(),
      };
      offers.set(row.id, row);
      return row;
    }),
    withdrawOffer: vi.fn(async (offerId, responderId) => {
      const o = offers.get(offerId);
      if (!o || o.responderId !== responderId || o.status !== "OFFERED") {
        throw new OfferNotAvailableError("Offer is no longer available");
      }
      o.status = "WITHDRAWN";
    }),
    rejectOffer: vi.fn(async (alertId, offerId) => {
      const o = offers.get(offerId);
      if (!o || o.alertId !== alertId || o.status !== "OFFERED") {
        throw new OfferNotAvailableError("Offer is no longer available");
      }
      o.status = "REJECTED";
    }),
    listOffersForAlert: vi.fn(async (alertId) => [...offers.values()].filter((o) => o.alertId === alertId)),
    findRespondedAlertIds: vi.fn(async (responderId, alertIds) => {
      const ids = [...offers.values()]
        .filter((o) => o.responderId === responderId && alertIds.includes(o.alertId))
        .map((o) => o.alertId);
      return new Set(ids);
    }),
  };

  const sosSessions: SafetyLocationPorts["sosSessions"] = {
    ...(emptyRepos().sosSessions as SafetyLocationPorts["sosSessions"]),
    acceptOffer: vi.fn(async ({ alertId, offerId }) => {
      const offer = offers.get(offerId);
      if (!offer || offer.alertId !== alertId || offer.status !== "OFFERED") {
        throw new OfferNotAvailableError("Offer is no longer available");
      }
      if (alert.assignedHelperId) throw new AlreadyAssignedError("Alert already has an assigned helper");

      alert = { ...alert, assignedHelperId: offer.responderId };
      offer.status = "ACCEPTED";
      // Mirrors sos-session.repository.ts's acceptOffer transaction: every other OFFERED
      // response on this alert is expired in the same step, not left dangling.
      const expiredResponderIds: string[] = [];
      for (const o of offers.values()) {
        if (o.alertId === alertId && o.id !== offerId && o.status === "OFFERED") {
          o.status = "EXPIRED";
          expiredResponderIds.push(o.responderId);
        }
      }
      session = {
        id: "session-1",
        alertId,
        helperId: offer.responderId,
        riderId: alert.userId,
        status: "ACTIVE",
        conversationId: "conv-1",
        startedAt: new Date(),
        helperArrivedAt: null,
        assistanceStartedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        rating: null,
        ratingComment: null,
        helper: { id: offer.responderId, name: offer.responder.name, phone: offer.responder.phone, email: offer.responder.email },
        rider: { id: alert.userId, name: alert.userName, phone: alert.userPhone, email: alert.userEmail },
      };
      return { session, expiredResponderIds };
    }),
    getSessionById: vi.fn(async (id) => (session && session.id === id ? session : null)),
    getActiveSessionForAlert: vi.fn(async (alertId) => (session && session.alertId === alertId ? session : null)),
    updateSessionStatus: vi.fn(async (sessionId, status, cancelReason) => {
      if (!session || session.id !== sessionId) throw new Error("no session");
      session = { ...session, status, cancelReason: cancelReason ?? session.cancelReason };
      return session;
    }),
    submitRating: vi.fn(async (sessionId, rating, comment) => {
      if (session && session.id === sessionId) {
        session = { ...session, rating, ratingComment: comment ?? null };
      }
    }),
    findActiveHelperUserIds: vi.fn(async (userIds: string[]) => {
      const active = ["ACTIVE", "HELPER_ARRIVED", "ASSISTANCE_IN_PROGRESS"];
      return new Set(userIds.filter((id) => session && session.helperId === id && active.includes(session.status)));
    }),
  };

  return {
    ports: { sosAlerts, sosOffers, sosSessions } satisfies Partial<SafetyLocationPorts>,
    getAlert: () => alert,
    getSession: () => session,
    getOffers: () => [...offers.values()],
  };
}

function buildModule(overrides: Partial<SafetyLocationPorts> = {}) {
  return createSafetyLocationModule({
    ...emptyRepos(overrides),
    communications: fakeCommunications(),
  });
}

describe("SOS end-to-end (ADR-045)", () => {
  it("Rider → Rider: create, a nearby rider offers, reporter accepts, session completes, alert resolves", async () => {
    const fake = createFakePorts({ userId: "rider-reporter", type: "BIKE_BREAKDOWN" });
    const module = buildModule(fake.ports);

    const offerResult = await module.session.offerHelp("alert-1", "rider-helper", { latitude: 1, longitude: 1 });
    expect(offerResult.ok).toBe(true);
    if (!offerResult.ok) throw new Error("unreachable");

    const acceptResult = await module.session.acceptOffer("alert-1", offerResult.offer.id, "rider-reporter", false);
    expect(acceptResult.ok).toBe(true);
    expect(fake.getAlert().assignedHelperId).toBe("rider-helper");

    await module.session.updateSessionStatus("session-1", "HELPER_ARRIVED", "rider-helper", false);
    await module.session.updateSessionStatus("session-1", "ASSISTANCE_IN_PROGRESS", "rider-helper", false);
    const completed = await module.session.updateSessionStatus("session-1", "COMPLETED", "rider-reporter", false);
    expect(completed.ok).toBe(true);

    const rated = await module.session.submitRating("session-1", "rider-reporter", 5, "Great help");
    expect(rated.ok).toBe(true);

    const resolved = await module.sos.resolveAlert("alert-1", "rider-reporter", false);
    expect(resolved.ok).toBe(true);
    expect(fake.getAlert().status).toBe("RESOLVED");
  });

  it("Rider → Service Provider: an unmapped category only reaches general-responder partners, not type-matched ones", async () => {
    const fake = createFakePorts({ userId: "rider-1", type: "MEDICAL", latitude: 10, longitude: 10 });
    const generalPartner = {
      userId: "partner-general",
      businessName: "General Responders Co",
      type: "MECHANIC",
      isGeneralResponder: true,
      contactPerson1Name: null,
      contactPerson1Mobile: null,
      contactPerson2Name: null,
      contactPerson2Mobile: null,
      latitude: 10.01,
      longitude: 10.01,
      distanceMeters: 500,
      user: { id: "partner-general", name: "General Responders Co", email: "gr@example.com", phone: "9000000001" },
    };
    const mechanicOnlyPartner = { ...generalPartner, userId: "partner-mechanic", isGeneralResponder: false };

    const module = buildModule({
      ...fake.ports,
      partnerDispatch: {
        findByCity: vi.fn(async () => []),
        findEligibleForAlert: vi.fn(async () => [generalPartner, mechanicOnlyPartner]),
        getEligibilityFields: vi.fn(async () => null),
      },
    });

    // Exercises the Service Provider resolver directly — the same one seedEscalation/tickEscalation
    // now call alongside the nearby-rider search at every radius step (ADR-047), not as a later
    // fallback tier.
    const providers = await module.escalation.resolveEscalationServiceProviders(fake.getAlert(), module.ports, 25_000);
    expect(providers.map((p) => p.name)).toEqual(["General Responders Co"]);
  });

  it("Provider eligibility: capacity and offline gates block an ineligible partner from offering", async () => {
    const fake = createFakePorts({ userId: "rider-1", type: "BIKE_BREAKDOWN" });
    const module = buildModule({
      ...fake.ports,
      partnerDispatch: {
        findByCity: vi.fn(async () => []),
        findEligibleForAlert: vi.fn(async () => []),
        getEligibilityFields: vi.fn(async (userId: string) =>
          userId === "partner-offline"
            ? { isVerified: true, isAvailable: false, isGeneralResponder: false, type: "MECHANIC" }
            : { isVerified: true, isAvailable: true, isGeneralResponder: false, type: "FUEL_DELIVERY" },
        ),
      },
    });

    const offline = await module.session.offerHelp("alert-1", "partner-offline", undefined, undefined, {
      requireAvailableAndCapacity: true,
    });
    expect(offline).toEqual({ ok: false, reason: "PARTNER_OFFLINE" });

    const mismatched = await module.session.offerHelp("alert-1", "partner-wrong-type", undefined, undefined, {
      requireAvailableAndCapacity: true,
    });
    expect(mismatched).toEqual({ ok: false, reason: "CATEGORY_MISMATCH" });
  });

  it("Multiple responders + assignment locking: accepting one offer expires the others, notifies them, and blocks a second accept", async () => {
    const fake = createFakePorts({ userId: "rider-reporter" });
    const notify = notifyMock();
    const module = buildModule({ ...fake.ports, notifications: { notify } });

    const offerA = await module.session.offerHelp("alert-1", "helper-a");
    const offerB = await module.session.offerHelp("alert-1", "helper-b");
    const offerC = await module.session.offerHelp("alert-1", "helper-c");
    if (!offerA.ok || !offerB.ok || !offerC.ok) throw new Error("unreachable");
    notify.mockClear(); // drop the 3 "someone offered to help" calls from offerHelp above

    const accept = await module.session.acceptOffer("alert-1", offerA.offer.id, "rider-reporter", false);
    expect(accept.ok).toBe(true);

    const others = fake.getOffers().filter((o) => o.id !== offerA.offer.id);
    expect(others.every((o) => o.status === "EXPIRED")).toBe(true);

    // ADR-047 — every responder whose pending offer just got auto-expired is told directly,
    // distinctly from the winner's own "You're confirmed" notification.
    expect(notify.mock.calls.find((c) => c[0] === "helper-a")?.[2]).toBe("You're confirmed");
    expect(notify.mock.calls.find((c) => c[0] === "helper-b")?.[2]).toBe("Request already assigned");
    expect(notify.mock.calls.find((c) => c[0] === "helper-c")?.[2]).toBe("Request already assigned");

    // Assignment locking, sequential case: offer B was expired the instant A was accepted (same
    // step, see the fake's acceptOffer above, mirroring the real transaction), so a second accept
    // attempt on it is rejected as a consumed offer — never a silent overwrite of the winner.
    const secondAccept = await module.session.acceptOffer("alert-1", offerB.offer.id, "rider-reporter", false);
    expect(secondAccept).toEqual({ ok: false, reason: "OFFER_NOT_AVAILABLE" });

    // The other half of the contract — a genuine *race* (two transactions both reading their own
    // offer as still OFFERED before either commits) surfaces ALREADY_ASSIGNED, not a double
    // assignment — is already covered directly against a raw AlreadyAssignedError mock in
    // safety-location.test.ts ("surfaces AlreadyAssignedError from acceptOffer as a
    // 409-mappable reason"); not duplicated here since this fake's sequential `acceptOffer` can't
    // represent two transactions racing against a single shared lock.
  });

  it("Decline: a partner declining without ever offering is excluded from their own Nearby Requests list afterward", async () => {
    const fake = createFakePorts({ userId: "rider-1", type: "FUEL_EMPTY", latitude: 5, longitude: 5 });
    const module = buildModule({
      ...fake.ports,
      partnerDispatch: {
        findByCity: vi.fn(async () => []),
        findEligibleForAlert: vi.fn(async () => []),
        getEligibilityFields: vi.fn(async () => ({
          isVerified: true,
          isAvailable: true,
          isGeneralResponder: false,
          type: "FUEL_DELIVERY",
        })),
      },
    });

    const before = await module.partnerDashboard.listNearbyOpenRequests("partner-1", { latitude: 5, longitude: 5 });
    expect(before).toHaveLength(1);

    const decline = await module.session.declineAlert("alert-1", "partner-1");
    expect(decline.ok).toBe(true);

    const after = await module.partnerDashboard.listNearbyOpenRequests("partner-1", { latitude: 5, longitude: 5 });
    expect(after).toHaveLength(0);

    const repeat = await module.session.declineAlert("alert-1", "partner-1");
    expect(repeat).toEqual({ ok: false, reason: "ALREADY_RESPONDED" });
  });

  it("PII protection: a non-privileged viewer gets redacted contact/location info; the reporter, assigned helper, and admin do not", async () => {
    const fake = createFakePorts({ userId: "rider-reporter", latitude: 12.9, longitude: 77.6 });
    const module = buildModule(fake.ports);

    const bystanderView = await module.sos.getAlertById("alert-1", { userId: "bystander", isAdmin: false });
    expect(bystanderView).toMatchObject({ userPhone: null, userEmail: null, latitude: null, longitude: null });

    const reporterView = await module.sos.getAlertById("alert-1", { userId: "rider-reporter", isAdmin: false });
    expect(reporterView).toMatchObject({ userEmail: "rider@example.com", latitude: 12.9, longitude: 77.6 });

    const adminView = await module.sos.getAlertById("alert-1", { userId: "admin-1", isAdmin: true });
    expect(adminView).toMatchObject({ userEmail: "rider@example.com", latitude: 12.9, longitude: 77.6 });

    const offer = await module.session.offerHelp("alert-1", "helper-1");
    if (!offer.ok) throw new Error("unreachable");
    await module.session.acceptOffer("alert-1", offer.offer.id, "rider-reporter", false);

    const helperViewAfterAssignment = await module.sos.getAlertById("alert-1", { userId: "helper-1", isAdmin: false });
    expect(helperViewAfterAssignment).toMatchObject({ userEmail: "rider@example.com", latitude: 12.9, longitude: 77.6 });

    const stillBystander = await module.sos.getAlertById("alert-1", { userId: "someone-else", isAdmin: false });
    expect(stillBystander).toMatchObject({ userPhone: null, userEmail: null, latitude: null, longitude: null });
  });

  it("SOS completion: the full offer → accept → arrive → in-progress → completed → rated lifecycle transitions correctly", async () => {
    const fake = createFakePorts({ userId: "rider-reporter" });
    const module = buildModule(fake.ports);

    const offer = await module.session.offerHelp("alert-1", "helper-1");
    if (!offer.ok) throw new Error("unreachable");
    await module.session.acceptOffer("alert-1", offer.offer.id, "rider-reporter", false);

    expect(fake.getSession()?.status).toBe("ACTIVE");
    await module.session.updateSessionStatus("session-1", "HELPER_ARRIVED", "helper-1", false);
    expect(fake.getSession()?.status).toBe("HELPER_ARRIVED");
    await module.session.updateSessionStatus("session-1", "ASSISTANCE_IN_PROGRESS", "helper-1", false);
    expect(fake.getSession()?.status).toBe("ASSISTANCE_IN_PROGRESS");
    await module.session.updateSessionStatus("session-1", "COMPLETED", "rider-reporter", false);
    expect(fake.getSession()?.status).toBe("COMPLETED");

    // Ownership rule: the helper cannot mark COMPLETED — only the rider can.
    const helperTriesComplete = await module.session.updateSessionStatus(
      "session-1",
      "COMPLETED",
      "helper-1",
      false,
    );
    expect(helperTriesComplete).toEqual({ ok: false, reason: "FORBIDDEN" });

    const rated = await module.session.submitRating("session-1", "rider-reporter", 4, "Thanks!");
    expect(rated.ok).toBe(true);
    expect(fake.getSession()?.rating).toBe(4);
  });

  it("Escalation: tiers advance community → general (riders + providers together) → admin in order (ADR-047)", async () => {
    const communityAlert = sampleAlert({ userId: "rider-1", currentRadiusMeters: 5000, escalationTier: "NEARBY_RIDERS_COMMUNITY" });
    const updateEscalationState = vi.fn(async () => undefined);
    const findAdminContacts = vi.fn(async () => [{ id: "admin-1", name: "Admin", email: "admin@bikie.app", phone: null }]);
    const findEligibleForAlert = vi.fn(async () => []);

    const module = buildModule({
      sosAlerts: {
        ...(emptyRepos().sosAlerts as SafetyLocationPorts["sosAlerts"]),
        updateEscalationState,
        findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
      },
      riderLocation: { ...(emptyRepos().riderLocation as SafetyLocationPorts["riderLocation"]), findNearbyAroundPoint: vi.fn(async () => []) },
      partnerDispatch: { findByCity: vi.fn(async () => []), findEligibleForAlert, getEligibilityFields: vi.fn(async () => null) },
      escalation: { findAdminContacts },
    });

    // COMMUNITY's one-shot window times out — advances straight to GENERAL. Service Providers
    // are searched in this same tick, at the same starting radius as riders (ADR-047) — no
    // separate SERVICE_PROVIDERS tier to wait for.
    await module.escalation.tickEscalation(communityAlert);
    expect(findEligibleForAlert).toHaveBeenCalled();
    expect(updateEscalationState).toHaveBeenCalledWith("alert-1", expect.objectContaining({ escalationTier: "NEARBY_RIDERS_GENERAL" }));

    // Once radius is maxed at GENERAL with nobody — rider or provider — having accepted, the
    // only remaining tier is ADMIN (the "never reach nobody" guarantee, ADR-030).
    findEligibleForAlert.mockClear();
    await module.escalation.tickEscalation({ ...communityAlert, escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 20_000 });
    expect(findAdminContacts).toHaveBeenCalled();
    expect(updateEscalationState).toHaveBeenCalledWith("alert-1", expect.objectContaining({ escalationTier: "ADMIN" }));
  });

  it("Rider SOS opt-out: an opted-out rider never appears in the nearby-rider dispatch pool", async () => {
    // The opt-out itself is enforced in findNearbyAroundPoint's SQL (rider-location.repository.ts,
    // not exercised by mocked-port tests — see the module doc comment); this asserts the
    // application layer correctly relays whatever the port returns, i.e. an opted-out rider who
    // the SQL already excluded never reaches dispatchToRecipient.
    const alert = sampleAlert({ userId: "rider-1" });
    const findNearbyAroundPoint = vi.fn(async () => [
      { id: "rider-opted-in", name: "Opted In", phone: "9000000002", email: "in@example.com", distanceMeters: 400 },
      // "rider-opted-out" deliberately absent — stands in for the SQL's own
      // `AND rl."receiveSosAlerts" = true` filter having already excluded them.
    ]);
    const module = buildModule({
      riderLocation: { ...(emptyRepos().riderLocation as SafetyLocationPorts["riderLocation"]), findNearbyAroundPoint },
      partnerDispatch: {
        findByCity: vi.fn(async () => []),
        findEligibleForAlert: vi.fn(async () => []),
        getEligibilityFields: vi.fn(async () => null),
      },
    });

    const { nearbyRiderCount } = await module.escalation.seedEscalation(alert);
    expect(nearbyRiderCount).toBe(1);
    expect(findNearbyAroundPoint).toHaveBeenCalledWith(alert.latitude, alert.longitude, "rider-1", 5000);
  });
});
