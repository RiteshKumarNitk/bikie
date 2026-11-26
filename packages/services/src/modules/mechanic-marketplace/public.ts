import { createMechanicListingApplication } from "./application/mechanic-listing.application";
import { createMechanicRequestApplication } from "./application/mechanic-request.application";
import {
  createMechanicListingRepositoryAdapter,
  createMechanicNotificationAdapter,
  createMechanicRequestRepositoryAdapter,
  createPartnerLookupAdapter,
} from "./infrastructure/repositories.adapter";
import type { MechanicMarketplacePorts } from "./ports";

export type MechanicMarketplaceModule = {
  ports: MechanicMarketplacePorts;
  listings: ReturnType<typeof createMechanicListingApplication>;
  requests: ReturnType<typeof createMechanicRequestApplication>;
};

export type MechanicMarketplaceDeps = Partial<MechanicMarketplacePorts>;

export function createMechanicMarketplaceModule(overrides: MechanicMarketplaceDeps = {}): MechanicMarketplaceModule {
  const ports: MechanicMarketplacePorts = {
    partners: overrides.partners ?? createPartnerLookupAdapter(),
    listings: overrides.listings ?? createMechanicListingRepositoryAdapter(),
    requests: overrides.requests ?? createMechanicRequestRepositoryAdapter(),
    notifications: overrides.notifications ?? createMechanicNotificationAdapter(),
  };

  return {
    ports,
    listings: createMechanicListingApplication(ports),
    requests: createMechanicRequestApplication(ports),
  };
}

let defaultModule: MechanicMarketplaceModule | null = null;

export function getMechanicMarketplaceModule(): MechanicMarketplaceModule {
  if (!defaultModule) defaultModule = createMechanicMarketplaceModule();
  return defaultModule;
}

export function setMechanicMarketplaceModuleForTests(module: MechanicMarketplaceModule | null): void {
  defaultModule = module;
}

export type { MechanicMarketplacePorts } from "./ports";
export type { MechanicListingRow, MechanicRequestRow } from "./ports";
