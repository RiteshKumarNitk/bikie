import { createPartnerApplication } from "./application/partner.application";
import { createPartnerRepositoryAdapter } from "./infrastructure/repositories.adapter";
import type { PartnersPorts } from "./ports";

export type PartnersModule = {
  ports: PartnersPorts;
  partners: ReturnType<typeof createPartnerApplication>;
};

export type PartnersDeps = Partial<PartnersPorts>;

export function createPartnersModule(overrides: PartnersDeps = {}): PartnersModule {
  const ports: PartnersPorts = {
    partners: overrides.partners ?? createPartnerRepositoryAdapter(),
  };

  return {
    ports,
    partners: createPartnerApplication(ports),
  };
}

let defaultModule: PartnersModule | null = null;

export function getPartnersModule(): PartnersModule {
  if (!defaultModule) defaultModule = createPartnersModule();
  return defaultModule;
}

export function setPartnersModuleForTests(module: PartnersModule | null): void {
  defaultModule = module;
}

export type {
  PartnersPorts,
  PartnerProfileInput,
  NearbyPartnerRow,
  UpsertProfileResult,
  SubmitApplicationResult,
  ReapplyResult,
} from "./ports";
