/**
 * Communications ports — provider-neutral contracts.
 * Application code depends on these interfaces, never on Twilio/Meta/SMTP/FCM.
 */

export type ChannelResult = {
  ok: boolean;
  provider: string;
  error?: string;
  /** Provider-side reference for a *successful* send — e.g. MSG91's request id from the
   * `sendsms` response. Gateway acceptance only; NOT proof the message reached the handset
   * (that comes from the provider's delivery report). Logged and, where useful, persisted so a
   * send can be traced in the provider dashboard. */
  detail?: string;
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
  /** Every distinct transactional SMS registered on MSG91's DLT entity needs its own template id
   * and exact matching text (ADR-058). The caller passes the template id for *this* SMS type;
   * the adapter uses it verbatim and NEVER substitutes another type's template. Omitting
   * `templateId` sends template-less (DLT will usually reject) — callers of a typed SMS resolve
   * their own `MSG91_*_TEMPLATE_ID` up front and refuse to send when it's unset, rather than
   * borrow one. `label` is an optional log tag (e.g. `"membership-subscribed"`, `"sos-help"`). */
  send(to: string, message: string, templateId?: string, label?: string): Promise<ChannelResult>;
  /** MSG91 Flow API (`v5/flow`) — a different transport than `send`'s `v2/sendsms` +
   * `DLT_TE_ID`: there is no pre-rendered text body, the fixed message lives entirely in the
   * MSG91 Flow template itself, and the caller fills it in by named placeholder variables
   * (`alphanumeric1`, `alphanumeric2`, ...) matching that template's actual configured order.
   * `templateId` here is a Flow template id, NOT a `DLT_TE_ID` — the two are never
   * interchangeable. `label` is the same optional log tag convention as `send`. */
  sendFlow(to: string, templateId: string, variables: Record<string, string>, label?: string): Promise<ChannelResult>;
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
