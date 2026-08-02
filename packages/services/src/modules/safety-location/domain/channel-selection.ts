import type { ChannelCapability, CommunicationsPorts } from "../../communications/ports";

export type ChannelAvailability = {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
};

/** A port with no `isConfigured` (test fakes, custom adapters) is treated as usable. */
function isChannelConfigured(port: ChannelCapability): boolean {
  return typeof port.isConfigured === "function" ? port.isConfigured() : true;
}

/** Which delivery channels this deployment can actually send on right now. */
export function resolveChannelAvailability(communications: CommunicationsPorts): ChannelAvailability {
  return {
    sms: isChannelConfigured(communications.sms),
    whatsapp: isChannelConfigured(communications.whatsapp),
    email: isChannelConfigured(communications.email),
  };
}

/**
 * Channels to use for one recipient: a channel needs both a configured provider and the
 * matching contact detail on the recipient's profile (phone → SMS/WhatsApp, email → email).
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
  };
}
