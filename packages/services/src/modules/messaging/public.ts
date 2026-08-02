import { createMessagesApplication } from "./application/messages.application";
import {
  createAccountStatusAdapter,
  createMessageCryptoAdapter,
  createMessageStoreAdapter,
  createMessagingRealtimeAdapter,
} from "./infrastructure/adapters";
import type { MessagingPorts } from "./ports";

export type MessagingModule = {
  ports: MessagingPorts;
  messages: ReturnType<typeof createMessagesApplication>;
};

export type MessagingDeps = Partial<MessagingPorts>;

export function createMessagingModule(overrides: MessagingDeps = {}): MessagingModule {
  const ports: MessagingPorts = {
    store: overrides.store ?? createMessageStoreAdapter(),
    crypto: overrides.crypto ?? createMessageCryptoAdapter(),
    realtime: overrides.realtime ?? createMessagingRealtimeAdapter(),
    accountStatus: overrides.accountStatus ?? createAccountStatusAdapter(),
  };

  return {
    ports,
    messages: createMessagesApplication(ports),
  };
}

let defaultModule: MessagingModule | null = null;

export function getMessagingModule(): MessagingModule {
  if (!defaultModule) defaultModule = createMessagingModule();
  return defaultModule;
}

export function setMessagingModuleForTests(module: MessagingModule | null): void {
  defaultModule = module;
}

export type { MessagingPorts } from "./ports";
export { isAccountMuted } from "./domain/mute";
