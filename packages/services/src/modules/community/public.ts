import { createCommunityApplication } from "./application/community.application";
import { createCommunityNotificationAdapter, createCommunityRepositoryAdapter } from "./infrastructure/repositories.adapter";
import type { CommunityPorts } from "./ports";

export type CommunityModule = {
  ports: CommunityPorts;
  community: ReturnType<typeof createCommunityApplication>;
};

export type CommunityDeps = Partial<CommunityPorts>;

export function createCommunityModule(overrides: CommunityDeps = {}): CommunityModule {
  const ports: CommunityPorts = {
    groups: overrides.groups ?? createCommunityRepositoryAdapter(),
    notifications: overrides.notifications ?? createCommunityNotificationAdapter(),
  };

  return {
    ports,
    community: createCommunityApplication(ports),
  };
}

let defaultModule: CommunityModule | null = null;

export function getCommunityModule(): CommunityModule {
  if (!defaultModule) defaultModule = createCommunityModule();
  return defaultModule;
}

export function setCommunityModuleForTests(module: CommunityModule | null): void {
  defaultModule = module;
}

export type { CommunityPorts, GroupSummary, GroupMembershipRow } from "./ports";
