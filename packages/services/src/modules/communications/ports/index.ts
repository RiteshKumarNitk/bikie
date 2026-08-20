/**
 * Communications ports — provider-neutral contracts.
 * Application code depends on these interfaces, never on Twilio/Meta/SMTP/FCM.
 */

export type ChannelResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushPlatform = "WEB" | "ANDROID" | "IOS";

export type RegisterPushTokenInput = {
  userId: string;
  token: string;
  platform?: PushPlatform;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
};

export type WhatsAppLocation = {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
};

/**
 * `isConfigured()` lets callers choose channels by what the deployment can actually deliver,
 * instead of firing every channel and counting DEV-only fallbacks as delivery attempts.
 * Optional so existing fakes/adapters stay valid; treat a missing implementation as configured.
 */
export interface ChannelCapability {
  isConfigured?(): boolean;
}

export interface EmailPort extends ChannelCapability {
  send(message: EmailMessage): Promise<ChannelResult>;
}

export interface SmsPort extends ChannelCapability {
  /** `templateId` overrides the adapter's default DLT template ID (`MSG91_TEMPLATE_ID`, used for
   * SOS alerts) — every distinct transactional SMS registered on MSG91's DLT entity needs its own
   * template ID and exact matching text (ADR-058), so a shared default can't cover more than one
   * message shape. */
  send(to: string, message: string, templateId?: string): Promise<ChannelResult>;
}

export interface WhatsAppPort extends ChannelCapability {
  send(to: string, message: string): Promise<ChannelResult>;
  sendLocation(to: string, location: WhatsAppLocation): Promise<ChannelResult>;
}

export interface PushPort {
  sendToUser(userId: string, payload: PushMessage): Promise<void>;
  registerToken?(input: RegisterPushTokenInput): Promise<void>;
  unregisterToken?(token: string): Promise<void>;
}

export type CommunicationsPorts = {
  email: EmailPort;
  sms: SmsPort;
  whatsapp: WhatsAppPort;
  push: PushPort;
};
