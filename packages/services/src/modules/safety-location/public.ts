import {
  createCommunicationsPorts,
  getCommunicationsPorts,
  type CommunicationsPorts,
} from "../communications/public";
import { createDispatchOrchestrator } from "./application/dispatch.application";
import { createEscalationApplication } from "./application/escalation.application";
import { createPlacesApplication } from "./application/places.application";
import { createRiderLocationApplication } from "./application/rider-location.application";
import { createSessionApplication } from "./application/session.application";
import { createSosApplication } from "./application/sos.application";
import { createInAppNotificationAdapter } from "./infrastructure/notification.adapter";
import { createPlacesAdapter } from "./infrastructure/places.adapter";
import {
  createCommunityMembershipAdapter,
  createEmergencyContactsAdapter,
  createEscalationAdapter,
  createPartnerDispatchAdapter,
  createRiderLocationRepositoryAdapter,
  createSosAlertRepositoryAdapter,
  createSosOfferRepositoryAdapter,
  createSosSessionRepositoryAdapter,
  createSosTimelineRepositoryAdapter,
  createUserContactAdapter,
} from "./infrastructure/repositories.adapter";
import type { SafetyLocationPorts } from "./ports";

export type SafetyLocationModule = {
  ports: SafetyLocationPorts;
  sos: ReturnType<typeof createSosApplication>;
  session: ReturnType<typeof createSessionApplication>;
  escalation: ReturnType<typeof createEscalationApplication>;
  riderLocation: ReturnType<typeof createRiderLocationApplication>;
  places: ReturnType<typeof createPlacesApplication>;
  dispatch: ReturnType<typeof createDispatchOrchestrator>;
};

export type SafetyLocationDeps = Partial<SafetyLocationPorts> & {
  communications?: CommunicationsPorts;
};

/** Composition root for safety-location — repositories + Places + notification + communications. */
export function createSafetyLocationModule(overrides: SafetyLocationDeps = {}): SafetyLocationModule {
  const communications = overrides.communications ?? createCommunicationsPorts();
  const ports: SafetyLocationPorts = {
    sosAlerts: overrides.sosAlerts ?? createSosAlertRepositoryAdapter(),
    sosOffers: overrides.sosOffers ?? createSosOfferRepositoryAdapter(),
    sosSessions: overrides.sosSessions ?? createSosSessionRepositoryAdapter(),
    sosTimeline: overrides.sosTimeline ?? createSosTimelineRepositoryAdapter(),
    community: overrides.community ?? createCommunityMembershipAdapter(),
    riderLocation: overrides.riderLocation ?? createRiderLocationRepositoryAdapter(),
    partnerDispatch: overrides.partnerDispatch ?? createPartnerDispatchAdapter(),
    emergencyContacts: overrides.emergencyContacts ?? createEmergencyContactsAdapter(),
    userContact: overrides.userContact ?? createUserContactAdapter(),
    escalation: overrides.escalation ?? createEscalationAdapter(),
    places: overrides.places ?? createPlacesAdapter(),
    notifications: overrides.notifications ?? createInAppNotificationAdapter(),
    communications: overrides.communications ?? communications,
  };

  return {
    ports,
    sos: createSosApplication(ports),
    session: createSessionApplication(ports),
    escalation: createEscalationApplication(ports),
    riderLocation: createRiderLocationApplication(ports),
    places: createPlacesApplication(ports),
    dispatch: createDispatchOrchestrator(ports),
  };
}

let defaultModule: SafetyLocationModule | null = null;

/** Lazy singleton used by compatibility facades (SOSService / RiderLocationService / …). */
export function getSafetyLocationModule(): SafetyLocationModule {
  if (!defaultModule) {
    defaultModule = createSafetyLocationModule({
      communications: getCommunicationsPorts(),
    });
  }
  return defaultModule;
}

/** Test-only: replace the default module composition. */
export function setSafetyLocationModuleForTests(module: SafetyLocationModule | null): void {
  defaultModule = module;
}

export type {
  NearbyPlace,
  PlaceType,
  SafetyLocationPorts,
  SOSRecipient,
} from "./ports";
export type { SOSRecipientRole } from "./domain/dispatch-message";
export type { SOSDispatchSummary, FanOutDeps } from "./application/fan-out.application";
export { mapsPinUrl, mapsNavigateUrl, formatDistance } from "./domain/maps";
export { alertKind } from "./domain/alert-kind";
export { deriveSeverity } from "./domain/severity";
export { buildTextBody, buildEmailHtml } from "./domain/dispatch-message";
export { channelsForRecipient, resolveChannelAvailability } from "./domain/channel-selection";
export type { ChannelAvailability } from "./domain/channel-selection";
