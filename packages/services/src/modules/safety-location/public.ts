import {
  createCommunicationsPorts,
  getCommunicationsPorts,
  type CommunicationsPorts,
} from "../communications/public";
import { createFanOutApplication } from "./application/fan-out.application";
import { createPlacesApplication } from "./application/places.application";
import { createRiderLocationApplication } from "./application/rider-location.application";
import { createSosApplication } from "./application/sos.application";
import { createInAppNotificationAdapter } from "./infrastructure/notification.adapter";
import { createPlacesAdapter } from "./infrastructure/places.adapter";
import {
  createEmergencyContactsAdapter,
  createPartnerDispatchAdapter,
  createRiderLocationRepositoryAdapter,
  createSosAlertRepositoryAdapter,
  createUserContactAdapter,
} from "./infrastructure/repositories.adapter";
import type { SafetyLocationPorts } from "./ports";

export type SafetyLocationModule = {
  ports: SafetyLocationPorts;
  sos: ReturnType<typeof createSosApplication>;
  riderLocation: ReturnType<typeof createRiderLocationApplication>;
  places: ReturnType<typeof createPlacesApplication>;
  dispatch: ReturnType<typeof createFanOutApplication>;
};

export type SafetyLocationDeps = Partial<SafetyLocationPorts> & {
  communications?: CommunicationsPorts;
};

/** Composition root for safety-location — repositories + Places + notification + communications. */
export function createSafetyLocationModule(overrides: SafetyLocationDeps = {}): SafetyLocationModule {
  const communications = overrides.communications ?? createCommunicationsPorts();
  const ports: SafetyLocationPorts = {
    sosAlerts: overrides.sosAlerts ?? createSosAlertRepositoryAdapter(),
    riderLocation: overrides.riderLocation ?? createRiderLocationRepositoryAdapter(),
    partnerDispatch: overrides.partnerDispatch ?? createPartnerDispatchAdapter(),
    emergencyContacts: overrides.emergencyContacts ?? createEmergencyContactsAdapter(),
    userContact: overrides.userContact ?? createUserContactAdapter(),
    places: overrides.places ?? createPlacesAdapter(),
    notifications: overrides.notifications ?? createInAppNotificationAdapter(),
    communications: overrides.communications ?? communications,
  };

  return {
    ports,
    sos: createSosApplication(ports),
    riderLocation: createRiderLocationApplication(ports),
    places: createPlacesApplication(ports),
    dispatch: createFanOutApplication(ports),
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
export { buildTextBody, buildEmailHtml } from "./domain/dispatch-message";
export { channelsForRecipient, resolveChannelAvailability } from "./domain/channel-selection";
export type { ChannelAvailability } from "./domain/channel-selection";
