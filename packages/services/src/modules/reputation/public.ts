import { createReputationApplication } from "./application/reputation.application";
import { createReputationRepositoryAdapter } from "./infrastructure/repositories.adapter";
import type { ReputationPorts } from "./ports";

export type ReputationModule = {
  ports: ReputationPorts;
  reputation: ReturnType<typeof createReputationApplication>;
};

/** Composition root for the reputation module — small and standalone so other modules
 * (safety-location today, potentially rides-community/trust-safety later) consume it through
 * a port rather than owning reputation logic themselves. */
export function createReputationModule(overrides: Partial<ReputationPorts> = {}): ReputationModule {
  const ports: ReputationPorts = {
    reputation: overrides.reputation ?? createReputationRepositoryAdapter(),
  };
  return { ports, reputation: createReputationApplication(ports) };
}

let defaultModule: ReputationModule | null = null;

export function getReputationModule(): ReputationModule {
  if (!defaultModule) defaultModule = createReputationModule();
  return defaultModule;
}

/** Test-only: replace the default module composition. */
export function setReputationModuleForTests(module: ReputationModule | null): void {
  defaultModule = module;
}

export type { ReputationPorts, ReputationRepositoryPort, ReputationStats } from "./ports";
export type { ReputationApplication } from "./application/reputation.application";
