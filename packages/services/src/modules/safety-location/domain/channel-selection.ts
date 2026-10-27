import type { ChannelCapability, CommunicationsPorts } from "../../communications/ports";

export type ChannelAvailability = {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  push: boolean;
};

/** The admin-controlled global on/off per channel (SosNotificationSettings) — only push and SMS
 * are admin-controllable (what was actually requested); WhatsApp/email are governed purely by
 * provider configuration, unchanged. */
export type SosNotificationSettingsInput = { pushEnabled: boolean; smsEnabled: boolean };

/** Matches today's always-on behavior — used whenever a caller doesn't have (or doesn't care
 * about) the admin-configurable settings, e.g. most existing tests. */
const DEFAULT_SOS_NOTIFICATION_SETTINGS: SosNotificationSettingsInput = { pushEnabled: true, smsEnabled: true };

/** A port with no `isConfigured` (test fakes, custom adapters) is treated as usable. */
function isChannelConfigured(port: ChannelCapability): boolean {
  return typeof port.isConfigured === "function" ? port.isConfigured() : true;
}

/** Which delivery channels this deployment can actually send on right now — provider
 * configuration AND-ed with the admin's global settings for the two channels that are
 * admin-controllable (push, SMS). */
export function resolveChannelAvailability(
  communications: CommunicationsPorts,
  settings: SosNotificationSettingsInput = DEFAULT_SOS_NOTIFICATION_SETTINGS,
): ChannelAvailability {
  return {
    sms: settings.smsEnabled && isChannelConfigured(communications.sms),
    whatsapp: isChannelConfigured(communications.whatsapp),
    email: isChannelConfigured(communications.email),
    push: settings.pushEnabled,
  };
}

/**
 * Channels to use for one recipient: a channel needs both a configured provider and the
 * matching contact detail on the recipient's profile (phone → SMS/WhatsApp, email → email).
 * Push has no contact-detail prerequisite here — the call site already gates it on the
 * recipient having a `userId` (see fan-out.application.ts's dispatchToRecipient).
 */
export function channelsForRecipient(
  recipient: { phone?: string | null; email?: string | null },
  availability: ChannelAvailability,
): ChannelAvailability {
  const hasPhone = Boolean(recipient.phone?.trim());
  const hasEmail = Boolean(recipient.email?.trim());
  return {
    sms: availability.sms && hasPhone,
    whatsapp: availability.whatsapp && hasPhone,
    email: availability.email && hasEmail,
    push: availability.push,
  };
}
