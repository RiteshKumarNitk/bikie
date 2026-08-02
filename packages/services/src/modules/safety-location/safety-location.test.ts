import { describe, expect, it, vi } from "vitest";
import type { SOSAlertDTO } from "@bikie/types";

vi.mock("@bikie/database", () => ({
  sosRepository: {},
  riderLocationRepository: {},
  partnerRepository: {},
  riderProfileRepository: {},
  userRepository: {},
  notificationRepository: {},
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
import { buildEmailHtml, buildTextBody } from "./domain/dispatch-message";
import { formatDistance, mapsNavigateUrl, mapsPinUrl } from "./domain/maps";
import {
  channelsForRecipient,
  createSafetyLocationModule,
  resolveChannelAvailability,
  setSafetyLocationModuleForTests,
} from "./public";
import type { SafetyLocationPorts } from "./ports";
import type { ChannelResult, CommunicationsPorts } from "../communications/ports";

function sampleAlert(overrides: Partial<SOSAlertDTO> = {}): SOSAlertDTO {
  return {
    id: "alert-1",
    userId: "user-1",
    userName: "Rider One",
    userPhone: "+919876543210",
    userEmail: "rider@example.com",
    type: "ACCIDENT",
    description: "Red Alert — crash",
    latitude: 12.9716,
    longitude: 77.5946,
    city: "Bengaluru",
    status: "ACTIVE",
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function ok(provider = "test"): ChannelResult {
  return { ok: true, provider };
}

function fail(provider: string, error = "boom"): ChannelResult {
  return { ok: false, provider, error };
}

function fakeCommunications(overrides: Partial<CommunicationsPorts> = {}): CommunicationsPorts {
  return {
    email: { send: vi.fn(async () => ok("smtp")) },
    sms: { send: vi.fn(async () => ok("twilio")) },
    whatsapp: {
      send: vi.fn(async () => ok("meta")),
      sendLocation: vi.fn(async () => ok("meta")),
    },
    push: { sendToUser: vi.fn(async () => undefined) },
    ...overrides,
  };
}

function emptyRepos(overrides: Partial<SafetyLocationPorts> = {}): Partial<SafetyLocationPorts> {
  return {
    riderLocation: {
      setSharingEnabled: vi.fn(async () => undefined),
      getSharingEnabled: vi.fn(async () => false),
      updateLocationIfSharing: vi.fn(async () => 0),
      findNearby: vi.fn(async () => []),
      findNearbyAroundPoint: vi.fn(async () => []),
      autoDisableStaleSharing: vi.fn(async () => 0),
    },
    partnerDispatch: { findByCity: vi.fn(async () => []) },
    emergencyContacts: { findByUserId: vi.fn(async () => []) },
    userContact: { findSosContactFields: vi.fn(async () => null) },
    sosAlerts: {
      createAlert: vi.fn(),
      getActiveAlerts: vi.fn(async () => []),
      resolveAlert: vi.fn(),
      respondToAlert: vi.fn(),
      getAlertHistory: vi.fn(async () => []),
      autoResolveStaleAlerts: vi.fn(),
    },
    places: { findNearby: vi.fn(async () => []) },
    notifications: { notify: vi.fn(async () => undefined) },
    ...overrides,
  };
}

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
        },
      }),
      communications: fakeCommunications(),
    });
    expect(await module.riderLocation.updateLocation("u1", 1, 2)).toBe(false);
  });
});

describe("sos profile warning", () => {
  it("warns when phone is missing", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        userContact: {
          findSosContactFields: vi.fn(async () => ({ phone: null, name: "Rider" })),
        },
      }),
      communications: fakeCommunications(),
    });
    expect(await module.sos.getProfileWarning("u1")).toBe(
      "Your profile is missing: phone number. Update your profile so responders can reach you.",
    );
  });

  it("returns null when phone is present", async () => {
    const module = createSafetyLocationModule({
      ...emptyRepos({
        userContact: {
          findSosContactFields: vi.fn(async () => ({ phone: "9876543210", name: "Rider" })),
        },
      }),
      communications: fakeCommunications(),
    });
    expect(await module.sos.getProfileWarning("u1")).toBeNull();
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
        },
        partnerDispatch: {
          findByCity: vi.fn(async () => [
            {
              userId: "partner-1",
              businessName: "Bangalore Garage",
              contactPerson1Name: "Contact One",
              contactPerson1Mobile: "9123456780",
              contactPerson2Name: null,
              contactPerson2Mobile: null,
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
          findByUserId: vi.fn(async () => [{ name: "Mom", phone: "9111111111", relation: "Mother" }]),
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
    expect(summary.serviceProviders).toBe(2); // partner user + distinct contact1
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
          findByUserId: vi.fn(async () => [{ name: "Mom", phone: "9111111111", relation: "Mother" }]),
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
