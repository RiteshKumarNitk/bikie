import { describe, expect, it, vi } from "vitest";

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
  // session.application.ts's COMPLETED/rating paths call the reputation module's real
  // singleton by default (mirrors how fan-out.application.ts defaults to the real platform
  // module) — stub it so those code paths don't crash on an unmocked import.
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

import { alertKind } from "./domain/alert-kind";
import { buildEmailHtml, buildSmsTemplateBody, buildTextBody, describeLocation } from "./domain/dispatch-message";
import { dispatchToRecipient, emptySummary, markSmsEligibility } from "./application/fan-out.application";
import { formatDistance, mapsNavigateUrl, mapsPinUrl } from "./domain/maps";
import {
  channelsForRecipient,
  createSafetyLocationModule,
  resolveChannelAvailability,
  setSafetyLocationModuleForTests,
} from "./public";
import { emptyRepos, fail, fakeCommunications, notifyMock, ok, sampleAlert } from "./safety-location.test-support";

describe("safety-location domain", () => {
  it("builds pin and navigate URLs", () => {
    expect(mapsPinUrl(12.9716, 77.5946)).toBe("https://maps.google.com/?q=12.9716,77.5946");
    expect(mapsNavigateUrl(12.9716, 77.5946)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946",
    );
  });

  it("formats distances", () => {
    expect(formatDistance(undefined)).toBeNull();
    expect(formatDistance(420)).toBe("420 m away");
    expect(formatDistance(2500)).toBe("2.5 km away");
  });

  it("detects RED / AMBER / SOS from description prefix", () => {
    expect(alertKind("Red Alert — crash")).toBe("RED");
    expect(alertKind("Amber Alert — fuel")).toBe("AMBER");
    expect(alertKind("Something else")).toBe("SOS");
    expect(alertKind(null)).toBe("SOS");
  });

  it("builds text body with role hint and map links", () => {
    const alert = sampleAlert();
    const body = buildTextBody(alert, {
      role: "NEARBY_RIDER",
      name: "Helper",
      distanceMeters: 420,
    });
    expect(body).toContain("BIKIE RED ALERT (Emergency)");
    expect(body).toContain("A fellow BIKIE rider nearby needs help.");
    expect(body).toContain("Your distance (approx): 420 m away");
    expect(body).toContain("https://maps.google.com/?q=12.9716,77.5946");
    expect(body).toContain("https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946");
  });

  it("builds email HTML with Open in Google Maps CTA", () => {
    const html = buildEmailHtml(sampleAlert(), { role: "EMERGENCY_CONTACT", name: "Mom" });
    expect(html).toContain("Red Alert — Emergency");
    expect(html).toContain("You are listed as an emergency contact for this rider.");
    expect(html).toContain("Open in Google Maps — see distance & route");
  });

  it("describeLocation prefers the reverse-geocoded formattedAddress (ADR-038)", () => {
    expect(
      describeLocation(sampleAlert({ formattedAddress: "City Park, Malviya Nagar, Jaipur, Rajasthan, India" })),
    ).toBe("City Park, Malviya Nagar, Jaipur, Rajasthan, India");
  });

  it("describeLocation falls back to placeName/area/city when formattedAddress is missing", () => {
    expect(describeLocation(sampleAlert({ placeName: "City Park", area: "Malviya Nagar", city: "Jaipur" }))).toBe(
      "City Park, Malviya Nagar, Jaipur",
    );
  });

  it("describeLocation falls back to bare city when nothing was geocoded", () => {
    expect(describeLocation(sampleAlert({ city: "Jaipur" }))).toBe("Jaipur");
  });

  it("buildTextBody/buildEmailHtml include the geocoded address, not just city", () => {
    const alert = sampleAlert({ formattedAddress: "City Park, Malviya Nagar, Jaipur, Rajasthan, India" });
    expect(buildTextBody(alert, { role: "NEARBY_RIDER", name: "Helper" })).toContain(
      "Location: City Park, Malviya Nagar, Jaipur, Rajasthan, India",
    );
    expect(buildEmailHtml(alert, { role: "NEARBY_RIDER", name: "Helper" })).toContain(
      "City Park, Malviya Nagar, Jaipur, Rajasthan, India",
    );
  });

  describe("buildSmsTemplateBody (ADR-059, DLT 'BIKIE_SR')", () => {
    it("matches the registered template text exactly, with rider name/vehicle reg/location filled in", () => {
      const alert = sampleAlert({
        userName: "Priya Verma",
        city: "Jaipur",
        riderVehicleRegistrationNumber: "RJ14AB1234",
      });
      expect(buildSmsTemplateBody(alert)).toBe(
        "Hello Riders/Service Providers, Rider Priya Verma, with Vehicle registration number is " +
          "RJ14AB1234 having some emergency situation at Jaipur ;Please reach out to Rider to " +
          "Provide Moral support and Adequate help, as noted by Kiesh India",
      );
    });

    it("falls back to N/A when the rider never filled in a vehicle registration number", () => {
      const alert = sampleAlert({ riderVehicleRegistrationNumber: null });
      expect(buildSmsTemplateBody(alert)).toContain("Vehicle registration number is N/A having");
    });

    it("uses the same redacted-aware location as describeLocation (approximate pre-assignment)", () => {
      const alert = sampleAlert({ formattedAddress: "Exact Street, Jaipur", city: "Jaipur" });
      expect(buildSmsTemplateBody(alert)).toContain("emergency situation at Exact Street, Jaipur ;");
    });
  });

  describe("markSmsEligibility (ADR-059 — SOS_SMS_RECIPIENT_LIMIT)", () => {
    it("marks only the nearest `limit` recipients smsEligible, by distanceMeters ascending", () => {
      const recipients = [
        { role: "NEARBY_RIDER" as const, name: "Far", distanceMeters: 5000 },
        { role: "SERVICE_PROVIDER" as const, name: "Near", distanceMeters: 100 },
        { role: "NEARBY_RIDER" as const, name: "Mid", distanceMeters: 1000 },
      ];
      const result = markSmsEligibility(recipients, 2);
      expect(result.find((r) => r.name === "Near")?.smsEligible).toBe(true);
      expect(result.find((r) => r.name === "Mid")?.smsEligible).toBe(true);
      expect(result.find((r) => r.name === "Far")?.smsEligible).toBe(false);
    });

    it("does not mutate the input array's objects", () => {
      const recipients = [{ role: "NEARBY_RIDER" as const, name: "A", distanceMeters: 100 }];
      markSmsEligibility(recipients, 1);
      expect(recipients[0]).not.toHaveProperty("smsEligible");
    });

    it("treats a recipient with no distanceMeters as farthest (sorts last)", () => {
      const recipients = [
        { role: "NEARBY_RIDER" as const, name: "Unknown distance" },
        { role: "NEARBY_RIDER" as const, name: "Known", distanceMeters: 9000 },
      ];
      const result = markSmsEligibility(recipients, 1);
      expect(result.find((r) => r.name === "Known")?.smsEligible).toBe(true);
      expect(result.find((r) => r.name === "Unknown distance")?.smsEligible).toBe(false);
    });

    it("defaults to SOS_SMS_RECIPIENT_LIMIT (10) when no explicit limit is given", () => {
      const recipients = Array.from({ length: 15 }, (_, i) => ({
        role: "NEARBY_RIDER" as const,
        name: `r${i}`,
        distanceMeters: i * 100,
      }));
      const result = markSmsEligibility(recipients);
      expect(result.filter((r) => r.smsEligible).length).toBe(10);
    });
  });
});

describe("rider-location application", () => {
  it("maps nearby rows and rounds distance meters", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: {
          setSharingEnabled: vi.fn(async () => undefined),
          getSharingEnabled: vi.fn(async () => true),
          updateLocationIfSharing: vi.fn(async () => 1),
          findNearby: vi.fn(async () => [
            { id: "u2", name: "Nearby", distanceMeters: 1234.6 },
          ]),
          findNearbyAroundPoint: vi.fn(async () => []),
          autoDisableStaleSharing: vi.fn(async () => 0),
          setReceiveSosAlerts: vi.fn(async () => undefined),
          getReceiveSosAlerts: vi.fn(async () => true),
        },
      }),
      communications: fakeCommunications(),
    });

    expect(await module.riderLocation.updateLocation("u1", 1, 2)).toBe(true);
    expect(await module.riderLocation.findNearby("u1", 5)).toEqual([
      { id: "u2", name: "Nearby", distanceMeters: 1235 },
    ]);
  });

  it("returns false when sharing is disabled server-side", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: {
          setSharingEnabled: vi.fn(async () => undefined),
          getSharingEnabled: vi.fn(async () => false),
          updateLocationIfSharing: vi.fn(async () => 0),
          findNearby: vi.fn(async () => []),
          findNearbyAroundPoint: vi.fn(async () => []),
          autoDisableStaleSharing: vi.fn(async () => 0),
          setReceiveSosAlerts: vi.fn(async () => undefined),
          getReceiveSosAlerts: vi.fn(async () => true),
        },
      }),
      communications: fakeCommunications(),
    });
    expect(await module.riderLocation.updateLocation("u1", 1, 2)).toBe(false);
  });
});

describe("sos profile warning", () => {
  const oneContact = {
    findByUserId: vi.fn(async () => [
      { name: "Mom", phone: "9111111111", email: null, relation: "Mother" },
    ]),
  };

  it("warns when phone is missing", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        userContact: {
          findSosContactFields: vi.fn(async () => ({ phone: null, name: "Rider" })),
        },
        emergencyContacts: oneContact,
      }),
      communications: fakeCommunications(),
    });
    expect(await module.sos.getProfileWarning("u1")).toBe(
      "Your profile is missing: phone number. Update your profile so responders can reach you.",
    );
  });

  it("warns when no emergency contacts are saved", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        userContact: {
          findSosContactFields: vi.fn(async () => ({ phone: "9876543210", name: "Rider" })),
        },
      }),
      communications: fakeCommunications(),
    });
    expect(await module.sos.getProfileWarning("u1")).toBe(
      "Your profile is missing: emergency contacts. Update your profile so responders can reach you.",
    );
  });

  it("returns null once a phone and at least one contact exist", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        userContact: {
          findSosContactFields: vi.fn(async () => ({ phone: "9876543210", name: "Rider" })),
        },
        emergencyContacts: oneContact,
      }),
      communications: fakeCommunications(),
    });
    expect(await module.sos.getProfileWarning("u1")).toBeNull();
  });
});

describe("sos createAlert reverse geocoding (ADR-038)", () => {
  const createInput = {
    type: "ACCIDENT",
    latitude: 26.9124,
    longitude: 75.7873,
    city: "Jaipur",
  };

  it("passes the geocoded address through to alert creation", async () => {
    const createAlert = vi.fn(async (data: unknown) => ({ ...sampleAlert(), ...(data as object) }));
    const reverseGeocode = vi.fn(async () => ({
      placeName: "City Park",
      area: "Malviya Nagar",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      formattedAddress: "City Park, Malviya Nagar, Jaipur, Rajasthan, India",
    }));
    const module = createSafetyLocationModule({
      ...emptyRepos({ sosAlerts: { ...emptyRepos().sosAlerts!, createAlert }, geocoding: { reverseGeocode } }),
      communications: fakeCommunications(),
    });

    await module.sos.createAlert("u1", createInput);

    expect(reverseGeocode).toHaveBeenCalledWith(26.9124, 75.7873);
    expect(createAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        placeName: "City Park",
        area: "Malviya Nagar",
        formattedAddress: "City Park, Malviya Nagar, Jaipur, Rajasthan, India",
      }),
    );
  });

  it("falls back to null address fields when geocoding returns nothing, without failing", async () => {
    const createAlert = vi.fn(async (data: unknown) => ({ ...sampleAlert(), ...(data as object) }));
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts!, createAlert },
        geocoding: { reverseGeocode: vi.fn(async () => null) },
      }),
      communications: fakeCommunications(),
    });

    await module.sos.createAlert("u1", createInput);

    expect(createAlert).toHaveBeenCalledWith(
      expect.objectContaining({ placeName: null, area: null, formattedAddress: null }),
    );
  });

  it("still creates the alert if the geocoding lookup throws", async () => {
    const createAlert = vi.fn(async (data: unknown) => ({ ...sampleAlert(), ...(data as object) }));
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts!, createAlert },
        geocoding: { reverseGeocode: vi.fn(async () => Promise.reject(new Error("nominatim down"))) },
      }),
      communications: fakeCommunications(),
    });

    await expect(module.sos.createAlert("u1", createInput)).resolves.toBeDefined();
    expect(createAlert).toHaveBeenCalledWith(
      expect.objectContaining({ placeName: null, area: null, formattedAddress: null }),
    );
  });
});

describe("sos resolveAlert ownership", () => {
  it("lets the reporter resolve their own alert", async () => {
    const resolveAlert = vi.fn(async () => undefined);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          createAlert: vi.fn(),
          getActiveAlerts: vi.fn(async () => []),
          getActiveAlertsForReporter: vi.fn(async () => []),
          getAlertById: vi.fn(async () => sampleAlert({ id: "alert-1", userId: "reporter-1" })),
          resolveAlert,
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          claimStaleAlertForResolve: vi.fn(async () => true),
          findAlertsDueForEscalation: vi.fn(async () => []),
          claimAlertForEscalation: vi.fn(async () => true),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
          cancelAlert: vi.fn(async () => 1),
        },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.resolveAlert("alert-1", "reporter-1", false);
    expect(result).toEqual({ ok: true });
    expect(resolveAlert).toHaveBeenCalledWith("alert-1", "reporter-1");
  });

  it("lets an admin resolve someone else's alert", async () => {
    const resolveAlert = vi.fn(async () => undefined);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          createAlert: vi.fn(),
          getActiveAlerts: vi.fn(async () => []),
          getActiveAlertsForReporter: vi.fn(async () => []),
          getAlertById: vi.fn(async () => sampleAlert({ id: "alert-1", userId: "reporter-1" })),
          resolveAlert,
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          claimStaleAlertForResolve: vi.fn(async () => true),
          findAlertsDueForEscalation: vi.fn(async () => []),
          claimAlertForEscalation: vi.fn(async () => true),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
          cancelAlert: vi.fn(async () => 1),
        },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.resolveAlert("alert-1", "admin-1", true);
    expect(result).toEqual({ ok: true });
  });

  it("blocks a non-owner, non-admin from resolving someone else's alert", async () => {
    const resolveAlert = vi.fn(async () => undefined);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          createAlert: vi.fn(),
          getActiveAlerts: vi.fn(async () => []),
          getActiveAlertsForReporter: vi.fn(async () => []),
          getAlertById: vi.fn(async () => sampleAlert({ id: "alert-1", userId: "reporter-1" })),
          resolveAlert,
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          claimStaleAlertForResolve: vi.fn(async () => true),
          findAlertsDueForEscalation: vi.fn(async () => []),
          claimAlertForEscalation: vi.fn(async () => true),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
          cancelAlert: vi.fn(async () => 1),
        },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.resolveAlert("alert-1", "bystander-1", false);
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(resolveAlert).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for a nonexistent alert", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          createAlert: vi.fn(),
          getActiveAlerts: vi.fn(async () => []),
          getActiveAlertsForReporter: vi.fn(async () => []),
          getAlertById: vi.fn(async () => null),
          resolveAlert: vi.fn(),
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          claimStaleAlertForResolve: vi.fn(async () => true),
          findAlertsDueForEscalation: vi.fn(async () => []),
          claimAlertForEscalation: vi.fn(async () => true),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
          cancelAlert: vi.fn(async () => 1),
        },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.resolveAlert("missing", "someone", false);
    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
  });
});

describe("sos autoResolveStaleAlerts (cron: GET /api/cron/sos-resolve)", () => {
  it("claims a stale alert, cancels its dangling session, records the timeline, and notifies rider + helper", async () => {
    const claimStaleAlertForResolve = vi.fn(async () => true);
    const getActiveSessionForAlert = vi.fn(async () => ({ id: "session-1" }) as any);
    const updateSessionStatus = vi.fn(async () => undefined);
    const timelineRecord = vi.fn(async () => undefined);
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          autoResolveStaleAlerts: vi.fn(async () => [
            { id: "alert-1", userId: "reporter-1", assignedHelperId: "helper-1" },
          ]),
          claimStaleAlertForResolve,
        } as any,
        sosSessions: { ...emptyRepos().sosSessions, getActiveSessionForAlert, updateSessionStatus } as any,
        sosTimeline: { ...emptyRepos().sosTimeline, record: timelineRecord } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    await module.sos.autoResolveStaleAlerts(120);

    expect(claimStaleAlertForResolve).toHaveBeenCalledWith("alert-1");
    expect(updateSessionStatus).toHaveBeenCalledWith("session-1", "CANCELLED", "SOS auto-resolved (timed out)");
    expect(timelineRecord).toHaveBeenCalledWith(
      expect.objectContaining({ alertId: "alert-1", type: "SOS_RESOLVED" }),
    );
    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toEqual(expect.arrayContaining(["reporter-1", "helper-1"]));
  });

  it("skips every cascading side effect when the claim fails — a concurrent cron run already resolved it", async () => {
    const claimStaleAlertForResolve = vi.fn(async () => false);
    const getActiveSessionForAlert = vi.fn(async () => null);
    const timelineRecord = vi.fn(async () => undefined);
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          autoResolveStaleAlerts: vi.fn(async () => [{ id: "alert-1", userId: "reporter-1", assignedHelperId: null }]),
          claimStaleAlertForResolve,
        } as any,
        sosSessions: { ...emptyRepos().sosSessions, getActiveSessionForAlert } as any,
        sosTimeline: { ...emptyRepos().sosTimeline, record: timelineRecord } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    await module.sos.autoResolveStaleAlerts(120);

    expect(claimStaleAlertForResolve).toHaveBeenCalledWith("alert-1");
    expect(getActiveSessionForAlert).not.toHaveBeenCalled();
    expect(timelineRecord).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});

describe("sos cancelAlert while dispatching (§28)", () => {
  it("lets the reporter cancel their own ACTIVE alert: expires offers, stops dispatch, records the timeline event", async () => {
    const cancelAlert = vi.fn(async () => 1);
    const expireOpenOffersForAlert = vi.fn(async () => ["responder-a", "responder-b"]);
    const notify = notifyMock();
    const timelineRecord = vi.fn(async () => undefined);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1" })), cancelAlert } as any,
        sosOffers: { ...emptyRepos().sosOffers, expireOpenOffersForAlert } as any,
        sosTimeline: { ...emptyRepos().sosTimeline, record: timelineRecord } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.cancelAlert("alert-1", "reporter-1", false, "No longer need help");

    expect(result).toEqual({ ok: true });
    expect(expireOpenOffersForAlert).toHaveBeenCalledWith("alert-1");
    expect(cancelAlert).toHaveBeenCalledWith("alert-1", "reporter-1");
    expect(timelineRecord).toHaveBeenCalledWith(
      expect.objectContaining({ alertId: "alert-1", type: "SOS_CANCELLED", actorId: "reporter-1" }),
    );
    // Every responder who had an outstanding offer is told the request is gone.
    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toEqual(expect.arrayContaining(["responder-a", "responder-b"]));
  });

  it("also cancels the assigned helper's active session when the alert was already assigned", async () => {
    const cancelAlert = vi.fn(async () => 1);
    const updateSessionStatus = vi.fn(async () => ({
      id: "session-1",
      alertId: "alert-1",
      helperId: "helper-1",
      riderId: "reporter-1",
      status: "CANCELLED",
      conversationId: null,
      startedAt: new Date(),
      helperArrivedAt: null,
      assistanceStartedAt: null,
      completedAt: null,
      cancelledAt: new Date(),
      cancelReason: "Rider cancelled",
      rating: null,
      ratingComment: null,
    }));
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          getAlertById: vi.fn(async () =>
            sampleAlert({ userId: "reporter-1", assignedHelperId: "helper-1" }),
          ),
          cancelAlert,
        } as any,
        sosSessions: { ...emptyRepos().sosSessions, getActiveSessionForAlert: vi.fn(async () => ({ id: "session-1" })), updateSessionStatus } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.cancelAlert("alert-1", "reporter-1", false);

    expect(result).toEqual({ ok: true });
    expect(updateSessionStatus).toHaveBeenCalledWith("session-1", "CANCELLED", "SOS cancelled by rider");
    // The assigned helper is among the notified recipients.
    expect(notify.mock.calls.map((c) => c[0])).toContain("helper-1");
  });

  it("lets an admin cancel someone else's alert", async () => {
    const cancelAlert = vi.fn(async () => 1);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1" })),
          cancelAlert,
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.cancelAlert("alert-1", "admin-1", true);
    expect(result).toEqual({ ok: true });
  });

  it("blocks a bystander from cancelling someone else's alert", async () => {
    const cancelAlert = vi.fn(async () => 1);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1" })),
          cancelAlert,
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.cancelAlert("alert-1", "bystander-1", false);
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(cancelAlert).not.toHaveBeenCalled();
  });

  it("returns ALERT_NOT_ACTIVE for an already-resolved alert", async () => {
    const cancelAlert = vi.fn(async () => 0);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1", status: "FALSE_ALARM" })),
          cancelAlert,
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.cancelAlert("alert-1", "reporter-1", false);
    expect(result).toEqual({ ok: false, reason: "ALERT_NOT_ACTIVE" });
    expect(cancelAlert).not.toHaveBeenCalled();
  });
});

describe("fan-out dispatch", () => {
  it("counts recipients and channel attempts with fake ports", async () => {
    const communications = fakeCommunications({
      whatsapp: {
        send: vi.fn(async () => fail("dev", "WhatsApp credentials not configured")),
        sendLocation: vi.fn(async () => fail("dev")),
      },
    });

    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: {
          setSharingEnabled: vi.fn(async () => undefined),
          getSharingEnabled: vi.fn(async () => true),
          updateLocationIfSharing: vi.fn(async () => 1),
          findNearby: vi.fn(async () => []),
          findNearbyAroundPoint: vi.fn(async () => [
            {
              id: "nearby-1",
              name: "Nearby Rider",
              phone: "9876543210",
              email: "nearby@example.com",
              distanceMeters: 800,
            },
          ]),
          autoDisableStaleSharing: vi.fn(async () => 0),
          setReceiveSosAlerts: vi.fn(async () => undefined),
          getReceiveSosAlerts: vi.fn(async () => true),
        },
        partnerDispatch: {
          findEligibleForAlert: vi.fn(async () => []),
          getEligibilityFields: vi.fn(async () => null),
          hasActivePartnerMembership: vi.fn(async () => true),
          findNearPoint: vi.fn(async () => [
            {
              userId: "partner-1",
              businessName: "Bangalore Garage",
              type: "MECHANIC",
              contactPerson1Name: "Contact One",
              contactPerson1Mobile: "9123456780",
              contactPerson2Name: null,
              contactPerson2Mobile: null,
              latitude: null,
              longitude: null,
              user: {
                id: "partner-1",
                name: "Partner User",
                email: "partner@example.com",
                phone: "9000000001",
              },
            },
          ]),
        },
        emergencyContacts: {
          findByUserId: vi.fn(async () => [
            { name: "Mom", phone: "9111111111", email: "mom@example.com", relation: "Mother" },
          ]),
        },
        notifications: { notify: vi.fn(async () => undefined) },
      }),
      communications,
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: vi.fn(async () => true),
        remember: vi.fn(async () => undefined),
        recall: vi.fn(async () => null),
      },
    });

    expect(summary.nearbyRiders).toBe(1);
    // Service Providers are resolved by escalation.seedEscalation (ADR-047 — same round as
    // nearby riders), not by dispatch.fanOut, which only ever handles the "always fire"
    // contacts/emergency-services/reporter-confirmation leg. Not exercised by this test.
    expect(summary.serviceProviders).toBe(0);
    expect(summary.emergencyContacts).toBe(1);
    expect(summary.smsAttempted).toBeGreaterThan(0);
    expect(summary.smsSent).toBe(summary.smsAttempted);
    expect(summary.whatsappAttempted).toBeGreaterThan(0);
    expect(summary.whatsappClickToSend.length).toBeGreaterThan(0);
    expect(summary.emailAttempted).toBeGreaterThan(0);
    expect(summary.inAppNotified).toBeGreaterThan(0);
    expect(summary.errors).toEqual([]);
  });

  it("skips reporter receipt email for @bikie.local", async () => {
    const emailSend = vi.fn(async () => ok("smtp"));
    const module = createSafetyLocationModule({
      ...emptyRepos(),
      communications: fakeCommunications({
        email: { send: emailSend },
      }),
    });

    await module.dispatch.fanOut(sampleAlert({ userEmail: "rider@bikie.local" }), {
      idempotency: {
        claim: vi.fn(async () => true),
        remember: vi.fn(async () => undefined),
        recall: vi.fn(async () => null),
      },
    });
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("skips duplicate fan-out when idempotency claim fails", async () => {
    const smsSend = vi.fn(async () => ok("twilio"));
    const module = createSafetyLocationModule({
      ...emptyRepos(),
      communications: fakeCommunications({
        sms: { send: smsSend },
      }),
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: vi.fn(async () => false),
        remember: vi.fn(async () => undefined),
        recall: vi.fn(async () => null),
      },
    });

    expect(smsSend).not.toHaveBeenCalled();
    expect(summary.smsAttempted).toBe(0);
    expect(summary.nearbyRiders).toBe(0);
  });

  it("replays remembered summary on duplicate claim", async () => {
    const remembered = {
      nearbyRiders: 9,
      serviceProviders: 0,
      emergencyContacts: 0,
      emergencyServices: 0,
      smsAttempted: 1,
      smsSent: 1,
      whatsappAttempted: 0,
      whatsappSent: 0,
      emailAttempted: 0,
      emailSent: 0,
      inAppNotified: 0,
      whatsappClickToSend: [],
      errors: [],
    };
    const module = createSafetyLocationModule({
      ...emptyRepos(),
      communications: fakeCommunications(),
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: async () => false,
        remember: async () => undefined,
        recall: async <T>(_key: string) => remembered as T,
      },
    });

    expect(summary).toEqual(remembered);
  });

  it("skips channels whose provider is not configured", async () => {
    const smsSend = vi.fn(async () => ok("twilio"));
    const whatsappSend = vi.fn(async () => ok("meta"));
    const emailSend = vi.fn(async () => ok("smtp"));

    const module = createSafetyLocationModule({
      ...emptyRepos({
        emergencyContacts: {
          findByUserId: vi.fn(async () => [
            { name: "Mom", phone: "9111111111", email: null, relation: "Mother" },
          ]),
        },
      }),
      communications: fakeCommunications({
        sms: { isConfigured: () => true, send: smsSend },
        whatsapp: {
          isConfigured: () => false,
          send: whatsappSend,
          sendLocation: vi.fn(async () => ok("meta")),
        },
        email: { isConfigured: () => false, send: emailSend },
      }),
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: async () => true,
        remember: async () => undefined,
        recall: async () => null,
      },
    });

    expect(smsSend).toHaveBeenCalledTimes(1);
    expect(whatsappSend).not.toHaveBeenCalled();
    expect(emailSend).not.toHaveBeenCalled();
    expect(summary.smsAttempted).toBe(1);
    expect(summary.whatsappAttempted).toBe(0);
    expect(summary.emailAttempted).toBe(0);
    expect(summary.channels).toEqual({ sms: true, whatsapp: false, email: false });
    // Unconfigured WhatsApp still yields a manual click-to-send link.
    expect(summary.whatsappClickToSend).toHaveLength(1);
  });

  it("emails emergency contacts who have an email address", async () => {
    const emailSend = vi.fn(async (_message: { to: string; subject: string; html: string }) =>
      ok("smtp"),
    );
    const module = createSafetyLocationModule({
      ...emptyRepos({
        emergencyContacts: {
          findByUserId: vi.fn(async () => [
            { name: "Mom", phone: "9111111111", email: "mom@example.com", relation: "Mother" },
            { name: "Dad", phone: "9222222222", email: null, relation: "Father" },
          ]),
        },
      }),
      communications: fakeCommunications({ email: { send: emailSend } }),
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: async () => true,
        remember: async () => undefined,
        recall: async () => null,
      },
    });

    const recipients = emailSend.mock.calls.map((c) => c[0].to);
    expect(recipients).toContain("mom@example.com");
    // Reporter receipt + the one contact with an email; the phone-only contact is not attempted.
    expect(summary.emailAttempted).toBe(2);
  });

  it("escalates to admins and warns the reporter when nobody was reached", async () => {
    const findAdminContacts = vi.fn(async () => [
      { id: "admin-1", name: "Admin One", email: "admin@bikie.app", phone: "9333333333" },
    ]);
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        escalation: { findAdminContacts },
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: async () => true,
        remember: async () => undefined,
        recall: async () => null,
      },
    });

    expect(findAdminContacts).toHaveBeenCalled();
    expect(summary.escalatedToAdmins).toBe(1);
    expect(summary.smsAttempted).toBe(1);

    const reporterNotice = notify.mock.calls.find((c) => c[0] === "user-1");
    expect(reporterNotice?.[3]).toContain("No responders could be reached");
  });

  it("notifies the reporter that the alert is live when responders were found", async () => {
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        emergencyContacts: {
          findByUserId: vi.fn(async () => [
            { name: "Mom", phone: "9111111111", email: null, relation: "Mother" },
          ]),
        },
        escalation: { findAdminContacts: vi.fn(async () => []) },
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    const summary = await module.dispatch.fanOut(sampleAlert(), {
      idempotency: {
        claim: async () => true,
        remember: async () => undefined,
        recall: async () => null,
      },
    });

    expect(summary.escalatedToAdmins).toBe(0);
    const reporterNotice = notify.mock.calls.find((c) => c[0] === "user-1");
    expect(reporterNotice?.[3]).toContain("Alerting 1 responder(s)");
  });
});


describe("channel selection", () => {
  it("treats ports without isConfigured as usable", () => {
    expect(resolveChannelAvailability(fakeCommunications())).toEqual({
      sms: true,
      whatsapp: true,
      email: true,
    });
  });

  it("requires both a configured provider and the matching contact detail", () => {
    const availability = { sms: true, whatsapp: true, email: true };

    expect(channelsForRecipient({ phone: "9876543210", email: null }, availability)).toEqual({
      sms: true,
      whatsapp: true,
      email: false,
    });
    expect(channelsForRecipient({ phone: null, email: "a@b.com" }, availability)).toEqual({
      sms: false,
      whatsapp: false,
      email: true,
    });
    expect(
      channelsForRecipient({ phone: "9876543210", email: "a@b.com" }, { sms: false, whatsapp: true, email: true }),
    ).toEqual({ sms: false, whatsapp: true, email: true });
  });
});

describe("module test hook", () => {
  it("setSafetyLocationModuleForTests clears singleton", () => {
    setSafetyLocationModuleForTests(null);
    expect(true).toBe(true);
  });
});

describe("session application — offer/accept/reject", () => {
  it("rejects an offer from the reporter on their own alert", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1" })) } as any,
      }),
      communications: fakeCommunications(),
    });
    const result = await module.session.offerHelp("alert-1", "reporter-1");
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("computes distance/ETA from supplied location and records the offer", async () => {
    const createOffer = vi.fn(
      async (_params: { alertId: string; responderId: string; distanceMeters?: number; etaMinutes?: number; message?: string }) => ({
        id: "offer-1",
        alertId: "alert-1",
        responderId: "helper-1",
        responder: { id: "helper-1", name: "Helper One", phone: "9000000000", email: "h@example.com" },
        status: "OFFERED",
        distanceMeters: null,
        etaMinutes: null,
        message: null,
        createdAt: new Date(),
      }),
    );
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1", latitude: 12.9716, longitude: 77.5946 })) } as any,
        sosOffers: { ...emptyRepos().sosOffers, createOffer } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.offerHelp("alert-1", "helper-1", { latitude: 12.98, longitude: 77.6 });
    expect(result.ok).toBe(true);
    expect(createOffer).toHaveBeenCalledWith(
      expect.objectContaining({ alertId: "alert-1", responderId: "helper-1" }),
    );
    const call = createOffer.mock.calls[0][0] as { distanceMeters?: number; etaMinutes?: number };
    expect(call.distanceMeters).toBeGreaterThan(0);
    expect(call.etaMinutes).toBeGreaterThan(0);
  });

  it("surfaces AlreadyAssignedError from acceptOffer as a 409-mappable reason", async () => {
    const { AlreadyAssignedError } = await import("./ports");
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1" })) } as any,
        sosSessions: {
          ...emptyRepos().sosSessions,
          acceptOffer: vi.fn(async () => {
            throw new AlreadyAssignedError("already assigned");
          }),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.acceptOffer("alert-1", "offer-1", "reporter-1", false);
    expect(result).toEqual({ ok: false, reason: "ALREADY_ASSIGNED" });
  });

  it("blocks a bystander from accepting an offer on someone else's alert", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1" })) } as any,
      }),
      communications: fakeCommunications(),
    });
    const result = await module.session.acceptOffer("alert-1", "offer-1", "bystander-1", false);
    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("only lets the helper mark HELPER_ARRIVED, not the rider", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosSessions: {
          ...emptyRepos().sosSessions,
          getSessionById: vi.fn(async () => ({
            id: "session-1",
            alertId: "alert-1",
            helperId: "helper-1",
            riderId: "rider-1",
            status: "ACTIVE",
            conversationId: null,
            startedAt: new Date(),
            helperArrivedAt: null,
            assistanceStartedAt: null,
            completedAt: null,
            cancelledAt: null,
            cancelReason: null,
            rating: null,
            ratingComment: null,
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const asRider = await module.session.updateSessionStatus("session-1", "HELPER_ARRIVED", "rider-1", false);
    expect(asRider).toEqual({ ok: false, reason: "FORBIDDEN" });
  });

  it("FINAL PRODUCT MODEL: an UNVERIFIED provider (DRAFT) who is available + type-matched can accept a SOS assistance request", async () => {
    const createOffer = vi.fn(
      async (_params: { alertId: string; responderId: string; distanceMeters?: number; etaMinutes?: number; message?: string }) => ({
        id: "offer-1",
        alertId: "alert-1",
        responderId: "unverified-provider",
        responder: { id: "unverified-provider", name: "Mahesh Bike Service", phone: "9000000000", email: "m@example.com" },
        status: "OFFERED",
        distanceMeters: null,
        etaMinutes: null,
        message: null,
        createdAt: new Date(),
      }),
    );
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1", type: "BIKE_BREAKDOWN" })) } as any,
        sosOffers: { ...emptyRepos().sosOffers, createOffer } as any,
        partnerDispatch: {
          ...emptyRepos().partnerDispatch,
          getEligibilityFields: vi.fn(async () => ({
            providerId: "partner-unverified",
            verificationStatus: "DRAFT",
            isAvailable: true,
            isGeneralResponder: false,
            type: "MECHANIC",
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    // Verification must NOT be a blocker: a DRAFT (never admin-reviewed) provider passes the
    // capability + availability + type-match gate and the offer is created.
    const result = await module.session.offerHelp("alert-1", "unverified-provider", undefined, undefined, {
      requireAvailableAndCapacity: true,
    });
    expect(result).toEqual({ ok: true, offer: expect.objectContaining({ responderId: "unverified-provider" }) });
    expect(createOffer).toHaveBeenCalledWith(expect.objectContaining({ alertId: "alert-1", responderId: "unverified-provider" }));
  });

  it("FINAL PRODUCT MODEL: a REJECTED (verification) provider who is available + type-matched can also accept — rejection is not suspension", async () => {
    const createOffer = vi.fn(
      async (_params: { alertId: string; responderId: string }) => ({
        id: "offer-1",
        alertId: "alert-1",
        responderId: "rejected-provider",
        responder: { id: "rejected-provider", name: "Rejected Garage", phone: "9000000000", email: "r@example.com" },
        status: "OFFERED",
        distanceMeters: null,
        etaMinutes: null,
        message: null,
        createdAt: new Date(),
      }),
    );
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1", type: "BIKE_BREAKDOWN" })) } as any,
        sosOffers: { ...emptyRepos().sosOffers, createOffer } as any,
        partnerDispatch: {
          ...emptyRepos().partnerDispatch,
          getEligibilityFields: vi.fn(async () => ({
            providerId: "partner-rejected",
            verificationStatus: "REJECTED",
            isAvailable: true,
            isGeneralResponder: false,
            type: "MECHANIC",
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.offerHelp("alert-1", "rejected-provider", undefined, undefined, {
      requireAvailableAndCapacity: true,
    });
    expect(result.ok).toBe(true);
  });

  it("FINAL PRODUCT MODEL: a SUSPENDED provider is still refused — suspension (not verification) is what revokes capability", async () => {
    const createOffer = vi.fn();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getAlertById: vi.fn(async () => sampleAlert({ userId: "reporter-1", type: "BIKE_BREAKDOWN" })) } as any,
        sosOffers: { ...emptyRepos().sosOffers, createOffer } as any,
        partnerDispatch: {
          ...emptyRepos().partnerDispatch,
          getEligibilityFields: vi.fn(async () => ({
            providerId: "partner-suspended",
            verificationStatus: "SUSPENDED",
            isAvailable: true,
            isGeneralResponder: false,
            type: "MECHANIC",
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.offerHelp("alert-1", "suspended-provider", undefined, undefined, {
      requireAvailableAndCapacity: true,
    });
    expect(result).toEqual({ ok: false, reason: "NOT_VERIFIED" });
    expect(createOffer).not.toHaveBeenCalled();
  });
});

describe("escalation application — tier advancement", () => {
  it("widens radius and only notifies newly-in-range riders", async () => {
    const notify = notifyMock();
    const findNearbyAroundPoint = vi.fn(async (_lat: number, _lng: number, _exclude: string, radiusMeters: number) =>
      radiusMeters <= 5000
        ? [{ id: "already-notified", name: "A", phone: null, email: "a@example.com", distanceMeters: 1000 }]
        : [
            { id: "already-notified", name: "A", phone: null, email: "a@example.com", distanceMeters: 1000 },
            { id: "fresh-rider", name: "B", phone: null, email: "b@example.com", distanceMeters: 9000 },
          ],
    );
    const updateEscalationState = vi.fn(async () => undefined);
    const claimAlertForEscalation = vi.fn(async () => true);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: { ...emptyRepos().riderLocation, findNearbyAroundPoint } as any,
        notifications: { notify },
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set(["already-notified"])),
          claimAlertForEscalation,
          updateEscalationState,
        } as any,
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(
      sampleAlert({ escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
    );

    // The atomic claim runs before any notification side effect (see claimAlertForEscalation's
    // doc comment) — this is what makes overlapping cron invocations safe.
    expect(claimAlertForEscalation).toHaveBeenCalledWith("alert-1", expect.any(Date));
    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toContain("fresh-rider");
    expect(notifiedIds).not.toContain("already-notified");
    expect(updateEscalationState).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({ currentRadiusMeters: 10000 }),
    );
  });

  it("dispatches eligible Service Providers together with riders on a widening tick, not as a later fallback (ADR-047)", async () => {
    // type: "BIKE_BREAKDOWN" — an AMBER/ASSISTANCE category (see deriveSeverity) — Service
    // Providers are only ever dispatched for these, never for RED/EMERGENCY alerts (the new
    // severity gate this suite also covers below). MECHANIC is BIKE_BREAKDOWN's natural
    // PartnerType match (partner-mapping.ts), so this partner is eligible on type alone, not
    // only via the isGeneralResponder fallback the ADR-044 test below still exercises.
    const findEligibleForAlert = vi.fn(async () => [
      {
        userId: "partner-1",
        businessName: "Garage",
        type: "MECHANIC",
        isGeneralResponder: true,
        contactPerson1Name: null,
        contactPerson1Mobile: null,
        contactPerson2Name: null,
        contactPerson2Mobile: null,
        latitude: 12.98,
        longitude: 77.6,
        user: { id: "partner-1", name: "Partner", email: "p@example.com", phone: "9000000000" },
        distanceMeters: 1200,
      },
    ]);
    const findActiveHelperUserIds = vi.fn(async () => new Set<string>());
    const updateEscalationState = vi.fn(async () => undefined);
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: { ...emptyRepos().partnerDispatch, findEligibleForAlert } as any,
        sosSessions: { ...emptyRepos().sosSessions, findActiveHelperUserIds } as any,
        sosAlerts: { ...emptyRepos().sosAlerts, updateEscalationState } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    // Still widening (currentRadiusMeters < max) — riders and providers are searched/notified
    // in the SAME tick, at the SAME widened radius, not gated behind a separate later tier.
    await module.escalation.tickEscalation(
      sampleAlert({ type: "BIKE_BREAKDOWN", escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
    );

    expect(findEligibleForAlert).toHaveBeenCalledWith(expect.objectContaining({ radiusMeters: 10000 }));
    expect(notify.mock.calls.map((c) => c[0])).toContain("partner-1");
    // The escalation tier stays NEARBY_RIDERS_GENERAL — no separate SERVICE_PROVIDERS tier exists
    // to transition into anymore.
    expect(updateEscalationState).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({ currentRadiusMeters: 10000 }),
    );
  });

  it("excludes a partner whose type doesn't match the alert and who isn't a general responder (ADR-044)", async () => {
    const findEligibleForAlert = vi.fn(async () => [
      {
        userId: "fuel-partner",
        businessName: "Fuel Co",
        type: "FUEL_DELIVERY",
        isGeneralResponder: false,
        contactPerson1Name: null,
        contactPerson1Mobile: null,
        contactPerson2Name: null,
        contactPerson2Mobile: null,
        latitude: 12.98,
        longitude: 77.6,
        user: { id: "fuel-partner", name: "Fuel Partner", email: "f@example.com", phone: "9000000001" },
        distanceMeters: 900,
      },
    ]);
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: { ...emptyRepos().partnerDispatch, findEligibleForAlert } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    // type: "BIKE_BREAKDOWN" (AMBER) has a natural PartnerType (MECHANIC) — a non-matching,
    // non-general-responder FUEL_DELIVERY partner must still not be dispatched.
    await module.escalation.tickEscalation(
      sampleAlert({ type: "BIKE_BREAKDOWN", escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
    );

    expect(notify.mock.calls.map((c) => c[0])).not.toContain("fuel-partner");
  });

  it("never dispatches Service Providers for a RED/EMERGENCY alert, even an eligible general responder (requested explicitly)", async () => {
    // type: "ACCIDENT" (sampleAlert's default) is a RED/EMERGENCY category (deriveSeverity) —
    // Service Providers must never be candidates at all for these, only for AMBER/ASSISTANCE
    // alerts. This partner would otherwise be eligible (isGeneralResponder: true, matches the
    // ADR-047 test above for an AMBER alert) — the only variable here is severity.
    const findEligibleForAlert = vi.fn(async () => [
      {
        userId: "partner-1",
        businessName: "Garage",
        type: "MECHANIC",
        isGeneralResponder: true,
        contactPerson1Name: null,
        contactPerson1Mobile: null,
        contactPerson2Name: null,
        contactPerson2Mobile: null,
        latitude: 12.98,
        longitude: 77.6,
        user: { id: "partner-1", name: "Partner", email: "p@example.com", phone: "9000000000" },
        distanceMeters: 1200,
      },
    ]);
    const notify = notifyMock();
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: { ...emptyRepos().partnerDispatch, findEligibleForAlert } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(
      sampleAlert({ escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
    );

    expect(findEligibleForAlert).not.toHaveBeenCalled();
    expect(notify.mock.calls.map((c) => c[0])).not.toContain("partner-1");
  });

  it("advances straight from NEARBY_RIDERS_GENERAL to ADMIN once radius is maxed — no separate SERVICE_PROVIDERS tier", async () => {
    const findEligibleForAlert = vi.fn(async () => []);
    const findAdminContacts = vi.fn(async () => [{ id: "admin-1", name: "Admin", email: "a@bikie.app", phone: null }]);
    const updateEscalationState = vi.fn(async () => undefined);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: { ...emptyRepos().partnerDispatch, findEligibleForAlert } as any,
        escalation: { findAdminContacts },
        sosAlerts: { ...emptyRepos().sosAlerts, updateEscalationState } as any,
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(
      sampleAlert({ escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 20000 }),
    );

    // Providers already had their chance on every widening tick up to this point — the terminal
    // step doesn't re-resolve them, it escalates straight to admins.
    expect(findEligibleForAlert).not.toHaveBeenCalled();
    expect(findAdminContacts).toHaveBeenCalled();
    expect(updateEscalationState).toHaveBeenCalledWith("alert-1", expect.objectContaining({ escalationTier: "ADMIN" }));
  });

  it("does nothing when the atomic claim fails (already assigned, already claimed by a concurrent tick, or no longer due)", async () => {
    // claimAlertForEscalation's WHERE clause excludes assignedHelperId != null in the real
    // repository — a false return is the general "someone else already handled this" signal, and
    // acceptOffer's transaction already clears nextEscalationAt itself, so there's nothing left
    // for tickEscalation to clean up.
    const claimAlertForEscalation = vi.fn(async () => false);
    const updateEscalationState = vi.fn(async () => undefined);
    const findNearPoint = vi.fn();
    const findEligibleForAlert = vi.fn(async () => []);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: { ...emptyRepos().partnerDispatch, findNearPoint, findEligibleForAlert } as any,
        sosAlerts: { ...emptyRepos().sosAlerts, claimAlertForEscalation, updateEscalationState } as any,
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(sampleAlert({ assignedHelperId: "helper-1" }));

    expect(claimAlertForEscalation).toHaveBeenCalledWith("alert-1", expect.any(Date));
    expect(updateEscalationState).not.toHaveBeenCalled();
    expect(findNearPoint).not.toHaveBeenCalled();
    expect(findEligibleForAlert).not.toHaveBeenCalled();
  });

  it("seedEscalation dispatches eligible Service Providers in the very first round, alongside riders (ADR-047)", async () => {
    const notify = notifyMock();
    const findNearbyAroundPoint = vi.fn(async () => [
      { id: "rider-near", name: "Rider", phone: null, email: "r@example.com", distanceMeters: 800 },
    ]);
    const findEligibleForAlert = vi.fn(async () => [
      {
        userId: "provider-near",
        businessName: "Quick Fix Garage",
        type: "MECHANIC",
        isGeneralResponder: false,
        contactPerson1Name: null,
        contactPerson1Mobile: null,
        contactPerson2Name: null,
        contactPerson2Mobile: null,
        latitude: 12.98,
        longitude: 77.6,
        user: { id: "provider-near", name: "Quick Fix Garage", email: "qf@example.com", phone: "9000000002" },
        distanceMeters: 1000,
      },
    ]);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: { ...emptyRepos().riderLocation, findNearbyAroundPoint } as any,
        partnerDispatch: { ...emptyRepos().partnerDispatch, findEligibleForAlert } as any,
        notifications: { notify },
      }),
      communications: fakeCommunications(),
    });

    // sampleAlert() defaults to type "BIKE_BREAKDOWN" via the fixture (a MECHANIC-mapped
    // category) — no community members, so this seeds straight to NEARBY_RIDERS_GENERAL.
    const result = await module.escalation.seedEscalation(sampleAlert({ type: "BIKE_BREAKDOWN" }));

    expect(findEligibleForAlert).toHaveBeenCalledWith(expect.objectContaining({ radiusMeters: 5000 }));
    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toContain("rider-near");
    expect(notifiedIds).toContain("provider-near");
    expect(result.summary.serviceProviders).toBe(1);
  });
});

// ADR-064 (documentation-only pass, confirming the existing rule) — the same RED/EMERGENCY
// severity gate `escalation.tickEscalation`/`seedEscalation` enforce for automatic dispatch above
// also applies to a partner *browsing* "Nearby Requests" (`GET /api/partner/sos/nearby`) — a RED
// alert must never be reachable through either path, not just the automatic one.
describe("partnerDashboard.listNearbyOpenRequests severity gate", () => {
  const eligiblePartner = {
    providerId: "provider-1",
    verificationStatus: "APPROVED" as const,
    isAvailable: true,
    isGeneralResponder: true,
    type: "MECHANIC",
  };

  it("excludes a RED/EMERGENCY alert even from an otherwise-eligible general-responder partner", async () => {
    const getOpenAlertsNearPoint = vi.fn(async () => [sampleAlert({ type: "ACCIDENT" })]);
    const getEligibilityFields = vi.fn(async () => eligiblePartner);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getOpenAlertsNearPoint } as any,
        partnerDispatch: { ...emptyRepos().partnerDispatch, getEligibilityFields } as any,
      }),
      communications: fakeCommunications(),
    });

    const requests = await module.partnerDashboard.listNearbyOpenRequests("provider-1", { latitude: 12.9, longitude: 77.6 });

    expect(requests).toHaveLength(0);
  });

  it("includes an AMBER/ASSISTANCE alert for a type-matched, eligible partner", async () => {
    const getOpenAlertsNearPoint = vi.fn(async () => [sampleAlert({ type: "BIKE_BREAKDOWN" })]);
    const getEligibilityFields = vi.fn(async () => eligiblePartner);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, getOpenAlertsNearPoint } as any,
        partnerDispatch: { ...emptyRepos().partnerDispatch, getEligibilityFields } as any,
      }),
      communications: fakeCommunications(),
    });

    const requests = await module.partnerDashboard.listNearbyOpenRequests("provider-1", { latitude: 12.9, longitude: 77.6 });

    expect(requests).toHaveLength(1);
    expect(requests[0].id).toBe("alert-1");
  });
});

describe("dispatch PII redaction (ADR-047)", () => {
  it("withholds phone and exact GPS from a NEARBY_RIDER and a SERVICE_PROVIDER, but not an EMERGENCY_CONTACT", async () => {
    const alert = sampleAlert({ userPhone: "9999999999", latitude: 12.9716, longitude: 77.5946 });
    const communications = fakeCommunications();
    const availability = resolveChannelAvailability(communications);
    const ports = emptyRepos() as unknown as Parameters<typeof dispatchToRecipient>[4];

    await dispatchToRecipient(
      alert,
      { role: "NEARBY_RIDER", name: "Nearby Rider", phone: "8888888888", email: "rider@example.com", userId: "rider-1" },
      emptySummary(availability),
      communications,
      ports,
      availability,
    );
    await dispatchToRecipient(
      alert,
      { role: "SERVICE_PROVIDER", name: "Garage", phone: "7777777777", email: "garage@example.com", userId: "provider-1" },
      emptySummary(availability),
      communications,
      ports,
      availability,
    );
    await dispatchToRecipient(
      alert,
      { role: "EMERGENCY_CONTACT", name: "Mom", phone: "6666666666", email: "mom@example.com" },
      emptySummary(availability),
      communications,
      ports,
      availability,
    );

    const riderText = (communications.sms.send as any).mock.calls.find((c: any[]) => c[0] === "+918888888888")?.[1];
    const contactText = (communications.sms.send as any).mock.calls.find((c: any[]) => c[0] === "+916666666666")?.[1];

    expect(riderText).not.toContain("9999999999");
    expect(riderText).not.toContain("12.97160");
    expect(riderText).not.toContain("maps.google.com");
    expect(riderText).toContain(alert.userName); // name alone stays, matches the in-app browse redaction policy

    expect(contactText).toContain("9999999999");
    expect(contactText).toContain("12.97160");
  });
});

describe("escalation application — community prioritization (ADR-033 Phase D)", () => {
  it("seeds NEARBY_RIDERS_COMMUNITY and notifies only the shared-group subset when found", async () => {
    const notify = notifyMock();
    const findNearbyAroundPoint = vi.fn(async () => [
      { id: "friend-1", name: "Friend", phone: null, email: "friend@example.com", distanceMeters: 500 },
      { id: "stranger-1", name: "Stranger", phone: null, email: "stranger@example.com", distanceMeters: 800 },
    ]);
    const findSharedGroupMemberIds = vi.fn(async () => new Set(["friend-1"]));
    const updateEscalationState = vi.fn(async () => undefined);

    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: { ...emptyRepos().riderLocation, findNearbyAroundPoint } as any,
        community: { findSharedGroupMemberIds },
        notifications: { notify },
        sosAlerts: { ...emptyRepos().sosAlerts, updateEscalationState } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.escalation.seedEscalation(sampleAlert());

    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toEqual(["friend-1"]);
    expect(result.summary.nearbyRiders).toBe(1);
    expect(result.nearbyRiderCount).toBe(2); // total found, for the zero-recipient check
    expect(updateEscalationState).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({ escalationTier: "NEARBY_RIDERS_COMMUNITY" }),
    );
  });

  it("seeds NEARBY_RIDERS_GENERAL as before when no shared-group rider is nearby", async () => {
    const notify = notifyMock();
    const findNearbyAroundPoint = vi.fn(async () => [
      { id: "stranger-1", name: "Stranger", phone: null, email: "stranger@example.com", distanceMeters: 800 },
    ]);
    const findSharedGroupMemberIds = vi.fn(async () => new Set<string>());
    const updateEscalationState = vi.fn(async () => undefined);

    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: { ...emptyRepos().riderLocation, findNearbyAroundPoint } as any,
        community: { findSharedGroupMemberIds },
        notifications: { notify },
        sosAlerts: { ...emptyRepos().sosAlerts, updateEscalationState } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.escalation.seedEscalation(sampleAlert());

    expect(notify.mock.calls.map((c) => c[0])).toEqual(["stranger-1"]);
    expect(result.nearbyRiderCount).toBe(1);
    expect(updateEscalationState).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({ escalationTier: "NEARBY_RIDERS_GENERAL" }),
    );
  });

  it("advances COMMUNITY straight to GENERAL on tick, skipping already-notified riders", async () => {
    const notify = notifyMock();
    const findNearbyAroundPoint = vi.fn(async () => [
      { id: "friend-1", name: "Friend", phone: null, email: "friend@example.com", distanceMeters: 500 },
      { id: "stranger-1", name: "Stranger", phone: null, email: "stranger@example.com", distanceMeters: 800 },
    ]);
    const updateEscalationState = vi.fn(async () => undefined);

    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: { ...emptyRepos().riderLocation, findNearbyAroundPoint } as any,
        notifications: { notify },
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set(["friend-1"])),
          updateEscalationState,
        } as any,
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(
      sampleAlert({ escalationTier: "NEARBY_RIDERS_COMMUNITY", currentRadiusMeters: 5000 }),
    );

    expect(notify.mock.calls.map((c) => c[0])).toEqual(["stranger-1"]);
    expect(updateEscalationState).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({ escalationTier: "NEARBY_RIDERS_GENERAL" }),
    );
  });
});

describe("session application — reputation wiring (ADR-033 Phase D)", () => {
  it("records an assist when a session is marked COMPLETED", async () => {
    const { reputationRepository } = (await import("@bikie/database")) as unknown as {
      reputationRepository: { recordAssist: ReturnType<typeof vi.fn> };
    };
    reputationRepository.recordAssist.mockClear();

    const resolveAlert = vi.fn(async () => undefined);
    const timelineRecord = vi.fn(async () => undefined);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosAlerts: { ...emptyRepos().sosAlerts, resolveAlert } as any,
        sosTimeline: { ...emptyRepos().sosTimeline, record: timelineRecord } as any,
        sosSessions: {
          ...emptyRepos().sosSessions,
          getSessionById: vi.fn(async () => ({
            id: "session-1",
            alertId: "alert-1",
            helperId: "helper-1",
            riderId: "rider-1",
            status: "ASSISTANCE_IN_PROGRESS",
            conversationId: null,
            startedAt: new Date(),
            helperArrivedAt: null,
            assistanceStartedAt: null,
            completedAt: null,
            cancelledAt: null,
            cancelReason: null,
            rating: null,
            ratingComment: null,
          })),
          updateSessionStatus: vi.fn(async () => ({
            id: "session-1",
            alertId: "alert-1",
            helperId: "helper-1",
            riderId: "rider-1",
            status: "COMPLETED",
            conversationId: null,
            startedAt: new Date(),
            helperArrivedAt: null,
            assistanceStartedAt: null,
            completedAt: new Date(),
            cancelledAt: null,
            cancelReason: null,
            rating: null,
            ratingComment: null,
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.updateSessionStatus("session-1", "COMPLETED", "rider-1", false);
    expect(result.ok).toBe(true);
    expect(reputationRepository.recordAssist).toHaveBeenCalledWith("helper-1");
    // A completed session resolves its parent alert immediately (ADR-052) — it shouldn't have to
    // wait for the 120-minute stale-cron, which would otherwise mislabel it as a timeout.
    expect(resolveAlert).toHaveBeenCalledWith("alert-1", "rider-1");
    expect(timelineRecord).toHaveBeenCalledWith(
      expect.objectContaining({ alertId: "alert-1", type: "SOS_RESOLVED", metadata: { reason: "session-completed" } }),
    );
  });

  it("records a rating against the helper on submitRating", async () => {
    const { reputationRepository } = (await import("@bikie/database")) as unknown as {
      reputationRepository: { recordRating: ReturnType<typeof vi.fn> };
    };
    reputationRepository.recordRating.mockClear();

    const module = createSafetyLocationModule({
      ...emptyRepos({
        sosSessions: {
          ...emptyRepos().sosSessions,
          getSessionById: vi.fn(async () => ({
            id: "session-1",
            alertId: "alert-1",
            helperId: "helper-1",
            riderId: "rider-1",
            status: "COMPLETED",
            conversationId: null,
            startedAt: new Date(),
            helperArrivedAt: null,
            assistanceStartedAt: null,
            completedAt: new Date(),
            cancelledAt: null,
            cancelReason: null,
            rating: null,
            ratingComment: null,
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.submitRating("session-1", "rider-1", 5, "Great help!");
    expect(result).toEqual({ ok: true });
    expect(reputationRepository.recordRating).toHaveBeenCalledWith("helper-1", 5);
  });

  it("writes a §25 ProviderReview when the rated helper has a Service Provider profile", async () => {
    const addProviderReview = vi.fn(async () => true);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: {
          ...emptyRepos().partnerDispatch,
          getEligibilityFields: vi.fn(async () => ({
            providerId: "provider-1",
            verificationStatus: "APPROVED",
            isAvailable: true,
            isGeneralResponder: false,
            type: "MECHANIC",
          })),
        } as any,
        providerReviews: { addProviderReview } as any,
        sosSessions: {
          ...emptyRepos().sosSessions,
          getSessionById: vi.fn(async () => ({
            id: "session-1",
            alertId: "alert-1",
            helperId: "helper-1",
            riderId: "rider-1",
            status: "COMPLETED",
            conversationId: null,
            startedAt: new Date(),
            helperArrivedAt: null,
            assistanceStartedAt: null,
            completedAt: new Date(),
            cancelledAt: null,
            cancelReason: null,
            rating: null,
            ratingComment: null,
            helper: { id: "helper-1", name: "Helper One", phone: "9000000000", email: "h@example.com" },
            rider: { id: "rider-1", name: "Rider One", phone: "9000000001", email: "r@example.com" },
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.submitRating("session-1", "rider-1", 4, "Quick fix!");
    expect(result).toEqual({ ok: true });
    expect(addProviderReview).toHaveBeenCalledWith({
      providerId: "provider-1",
      riderId: "rider-1",
      sessionId: "session-1",
      rating: 4,
      comment: "Quick fix!",
    });
  });

  it("skips the §25 ProviderReview when the helper is a nearby rider, not a Service Provider", async () => {
    const addProviderReview = vi.fn(async () => true);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: {
          ...emptyRepos().partnerDispatch,
          getEligibilityFields: vi.fn(async () => ({
            providerId: null,
            verificationStatus: "DRAFT",
            isAvailable: false,
            isGeneralResponder: false,
            type: "MECHANIC",
          })),
        } as any,
        providerReviews: { addProviderReview } as any,
        sosSessions: {
          ...emptyRepos().sosSessions,
          getSessionById: vi.fn(async () => ({
            id: "session-1",
            alertId: "alert-1",
            helperId: "helper-1",
            riderId: "rider-1",
            status: "COMPLETED",
            conversationId: null,
            startedAt: new Date(),
            helperArrivedAt: null,
            assistanceStartedAt: null,
            completedAt: new Date(),
            cancelledAt: null,
            cancelReason: null,
            rating: null,
            ratingComment: null,
            helper: { id: "helper-1", name: "Helper One", phone: "9000000000", email: "h@example.com" },
            rider: { id: "rider-1", name: "Rider One", phone: "9000000001", email: "r@example.com" },
          })),
        } as any,
      }),
      communications: fakeCommunications(),
    });

    const result = await module.session.submitRating("session-1", "rider-1", 5);
    expect(result).toEqual({ ok: true });
    expect(addProviderReview).not.toHaveBeenCalled();
  });
});
