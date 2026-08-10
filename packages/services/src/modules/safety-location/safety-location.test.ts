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
import { buildEmailHtml, buildTextBody, describeLocation } from "./domain/dispatch-message";
import { dispatchToRecipient, emptySummary } from "./application/fan-out.application";
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
          getAlertById: vi.fn(async () => sampleAlert({ id: "alert-1", userId: "reporter-1" })),
          resolveAlert,
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          bulkResolve: vi.fn(async () => undefined),
          findAlertsDueForEscalation: vi.fn(async () => []),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
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
          getAlertById: vi.fn(async () => sampleAlert({ id: "alert-1", userId: "reporter-1" })),
          resolveAlert,
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          bulkResolve: vi.fn(async () => undefined),
          findAlertsDueForEscalation: vi.fn(async () => []),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
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
          getAlertById: vi.fn(async () => sampleAlert({ id: "alert-1", userId: "reporter-1" })),
          resolveAlert,
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          bulkResolve: vi.fn(async () => undefined),
          findAlertsDueForEscalation: vi.fn(async () => []),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
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
          getAlertById: vi.fn(async () => null),
          resolveAlert: vi.fn(),
          respondToAlert: vi.fn(),
          getAlertHistory: vi.fn(async () => []),
          autoResolveStaleAlerts: vi.fn(async () => []),
          bulkResolve: vi.fn(async () => undefined),
          findAlertsDueForEscalation: vi.fn(async () => []),
          updateEscalationState: vi.fn(async () => undefined),
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set<string>()),
          getOpenAlertsNearPoint: vi.fn(async () => []),
        },
      }),
      communications: fakeCommunications(),
    });

    const result = await module.sos.resolveAlert("missing", "someone", false);
    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
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
          findByCity: vi.fn(async () => [
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
    const module = createSafetyLocationModule({
      ...emptyRepos({
        riderLocation: { ...emptyRepos().riderLocation, findNearbyAroundPoint } as any,
        notifications: { notify },
        sosAlerts: {
          ...emptyRepos().sosAlerts,
          findNotifiedUserIdsForAlert: vi.fn(async () => new Set(["already-notified"])),
          updateEscalationState,
        } as any,
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(
      sampleAlert({ escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
    );

    const notifiedIds = notify.mock.calls.map((c) => c[0]);
    expect(notifiedIds).toContain("fresh-rider");
    expect(notifiedIds).not.toContain("already-notified");
    expect(updateEscalationState).toHaveBeenCalledWith(
      "alert-1",
      expect.objectContaining({ currentRadiusMeters: 10000 }),
    );
  });

  it("dispatches eligible Service Providers together with riders on a widening tick, not as a later fallback (ADR-047)", async () => {
    // sampleAlert() defaults to type "ACCIDENT", which has no natural PartnerType mapping — only
    // a general-responder partner is eligible, exactly the case ADR-044 was written to fix
    // (previously this would have broadened to *every* partner type via the removed fallback).
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
      sampleAlert({ escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
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

    // type: "ACCIDENT" (sampleAlert's default) has no natural PartnerType — a non-general-
    // responder FUEL_DELIVERY partner must not be dispatched a medical/accident emergency.
    await module.escalation.tickEscalation(
      sampleAlert({ escalationTier: "NEARBY_RIDERS_GENERAL", currentRadiusMeters: 5000 }),
    );

    expect(notify.mock.calls.map((c) => c[0])).not.toContain("fuel-partner");
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

  it("does nothing but clear the timer when the alert already has an assigned helper", async () => {
    const updateEscalationState = vi.fn(async () => undefined);
    const findByCity = vi.fn();
    const findEligibleForAlert = vi.fn(async () => []);
    const module = createSafetyLocationModule({
      ...emptyRepos({
        partnerDispatch: { ...emptyRepos().partnerDispatch, findByCity, findEligibleForAlert } as any,
        sosAlerts: { ...emptyRepos().sosAlerts, updateEscalationState } as any,
      }),
      communications: fakeCommunications(),
    });

    await module.escalation.tickEscalation(sampleAlert({ assignedHelperId: "helper-1" }));

    expect(findByCity).not.toHaveBeenCalled();
    expect(findEligibleForAlert).not.toHaveBeenCalled();
    expect(updateEscalationState).toHaveBeenCalledWith("alert-1", { nextEscalationAt: null });
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

    const module = createSafetyLocationModule({
      ...emptyRepos({
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
});
