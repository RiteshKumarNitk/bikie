/**
 * Shared test-only factories for the safety-location module — deliberately NOT named `*.test.ts`.
 * Vitest treats any imported `*.test.ts` file as its own test module and re-executes its
 * top-level `describe`/`it` blocks as a side effect of the import (with cross-file mock-call
 * bookkeeping bleeding across the two "runs") — importing `safety-location.test.ts` from
 * `safety-location.e2e.test.ts` hit exactly that, silently duplicating the whole suite and
 * corrupting shared `vi.fn()` call counts. This file exists so both test files can import the
 * same helpers without either one importing the other.
 *
 * Note: `vi.mock(...)` calls are NOT here — Vitest only hoists/applies `vi.mock` when it's
 * called directly inside a test file, so each test file still needs its own copy of those.
 */
import { vi } from "vitest";
import type { RawSOSAlertDTO } from "./domain/pii-redaction";
import type { SafetyLocationPorts } from "./ports";
import type { ChannelResult, CommunicationsPorts } from "../communications/ports";

export function sampleAlert(overrides: Partial<RawSOSAlertDTO> = {}): RawSOSAlertDTO {
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
    severity: "EMERGENCY",
    escalationTier: "NEARBY_RIDERS_GENERAL",
    currentRadiusMeters: 5000,
    assignedHelperId: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    placeName: null,
    area: null,
    formattedAddress: null,
    riderVehicleType: null,
    riderVehicleBrand: null,
    riderVehicleModel: null,
    ...overrides,
  };
}

export function ok(provider = "test"): ChannelResult {
  return { ok: true, provider };
}

export function fail(provider: string, error = "boom"): ChannelResult {
  return { ok: false, provider, error };
}

/** Typed so `.mock.calls[n][i]` stays indexable — a bare `vi.fn(async () => …)` infers `[]`. */
export function notifyMock() {
  return vi.fn(
    async (
      _userId: string,
      _type: "SOS_ALERT",
      _title: string,
      _body: string,
      _entity?: string,
      _entityId?: string,
    ) => undefined,
  );
}

export function fakeCommunications(overrides: Partial<CommunicationsPorts> = {}): CommunicationsPorts {
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

export function emptyRepos(overrides: Partial<SafetyLocationPorts> = {}): Partial<SafetyLocationPorts> {
  return {
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
    partnerDispatch: {
      findByCity: vi.fn(async () => []),
      findEligibleForAlert: vi.fn(async () => []),
      getEligibilityFields: vi.fn(async () => null),
    },
    emergencyContacts: { findByUserId: vi.fn(async () => []) },
    userContact: { findSosContactFields: vi.fn(async () => null) },
    escalation: { findAdminContacts: vi.fn(async () => []) },
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
    sosOffers: {
      createOffer: vi.fn(),
      withdrawOffer: vi.fn(async () => undefined),
      rejectOffer: vi.fn(async () => undefined),
      listOffersForAlert: vi.fn(async () => []),
      declineAlert: vi.fn(),
      findRespondedAlertIds: vi.fn(async () => new Set<string>()),
    },
    sosSessions: {
      acceptOffer: vi.fn(),
      getSessionById: vi.fn(async () => null),
      getActiveSessionForAlert: vi.fn(async () => null),
      updateSessionStatus: vi.fn(),
      submitRating: vi.fn(async () => undefined),
      findActiveHelperUserIds: vi.fn(async () => new Set<string>()),
      countSessionsForHelperSince: vi.fn(async () => 0),
      countActiveSessionsForHelper: vi.fn(async () => 0),
      listActiveSessionsForHelper: vi.fn(async () => []),
      listHistorySessionsForHelper: vi.fn(async () => []),
    },
    sosTimeline: {
      record: vi.fn(async () => undefined),
      listForAlert: vi.fn(async () => []),
    },
    community: {
      findSharedGroupMemberIds: vi.fn(async () => new Set<string>()),
    },
    places: { findNearby: vi.fn(async () => []) },
    geocoding: { reverseGeocode: vi.fn(async () => null) },
    notifications: { notify: vi.fn(async () => undefined) },
    ...overrides,
  };
}
