import type { CommunicationsPorts } from "./ports";
import { createEmailAdapter } from "./infrastructure/email.adapter";
import { createSmsAdapter } from "./infrastructure/sms.adapter";
import { createWhatsAppAdapter } from "./infrastructure/whatsapp.adapter";
import { createPushAdapter } from "./infrastructure/push.adapter";

let defaultPorts: CommunicationsPorts | null = null;

/** Composition root for communications adapters selected by env. */
export function createCommunicationsPorts(
  overrides: Partial<CommunicationsPorts> = {},
): CommunicationsPorts {
  return {
    email: overrides.email ?? createEmailAdapter(),
    sms: overrides.sms ?? createSmsAdapter(),
    whatsapp: overrides.whatsapp ?? createWhatsAppAdapter(),
    push: overrides.push ?? createPushAdapter(),
  };
}

/** Lazy singleton used by compatibility facades (EmailService / SMSService / …). */
export function getCommunicationsPorts(): CommunicationsPorts {
  if (!defaultPorts) defaultPorts = createCommunicationsPorts();
  return defaultPorts;
}

/** Test-only: replace the default ports composition. */
export function setCommunicationsPortsForTests(ports: CommunicationsPorts | null): void {
  defaultPorts = ports;
}

export type {
  ChannelResult,
  CommunicationsPorts,
  EmailMessage,
  EmailPort,
  PushMessage,
  PushPort,
  SmsPort,
  WhatsAppLocation,
  WhatsAppPort,
} from "./ports";
export { whatsappShareUrl, toMsisdn } from "./infrastructure/whatsapp.adapter";
export { fetchWithTimeout } from "./infrastructure/http";
