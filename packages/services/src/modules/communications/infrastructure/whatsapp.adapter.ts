import type { ChannelResult, WhatsAppLocation, WhatsAppPort } from "../ports";
import { fetchWithTimeout } from "./http";

/** Digits-only MSISDN (no `+`, no `whatsapp:` prefix) — Meta Cloud API format. */
export function toMsisdn(phone: string): string {
  const raw = phone.startsWith("whatsapp:") ? phone.slice("whatsapp:".length) : phone;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** Click-to-send deep link — works with zero API credentials. */
export function whatsappShareUrl(phone: string, message: string): string {
  return `https://wa.me/${toMsisdn(phone)}?text=${encodeURIComponent(message)}`;
}

async function sendViaMeta(phone: string, message: string): Promise<ChannelResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!.trim();
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v22.0";
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const to = toMsisdn(phone);

  const post = async (body: unknown) =>
    fetchWithTimeout(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  let res = await post({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: true, body: message },
  });

  if (!res.ok) {
    const failure = await res.text();
    const template = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
    const needsTemplate = /13104[0-9]|"code":\s*470|re-?engagement/i.test(failure);

    if (!template || !needsTemplate) {
      console.error(`[WHATSAPP][META] Failed to ${to}: ${failure}`);
      return { ok: false, provider: "meta", error: failure };
    }

    res = await post({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en_US" },
        components: [{ type: "body", parameters: [{ type: "text", text: message.slice(0, 1024) }] }],
      },
    });

    if (!res.ok) {
      const templateFailure = await res.text();
      console.error(`[WHATSAPP][META] Template send failed to ${to}: ${templateFailure}`);
      return { ok: false, provider: "meta", error: templateFailure };
    }
  }

  console.log(`[WHATSAPP][META] Sent to ${to}`);
  return { ok: true, provider: "meta" };
}

async function sendViaTwilio(phone: string, message: string): Promise<ChannelResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!;
  const normalizedTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;

  const res = await fetchWithTimeout(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: normalizedTo,
        From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
        Body: message,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`[WHATSAPP][TWILIO] Failed to ${normalizedTo}: ${body}`);
    return { ok: false, provider: "twilio", error: body };
  }

  console.log(`[WHATSAPP][TWILIO] Sent to ${normalizedTo}`);
  return { ok: true, provider: "twilio" };
}

function hasMetaCredentials(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

function hasTwilioWhatsAppCredentials(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  );
}

/** Meta Cloud API preferred, Twilio WhatsApp fallback, then DEV + wa.me. */
export function createWhatsAppAdapter(): WhatsAppPort {
  return {
    isConfigured() {
      return hasMetaCredentials() || hasTwilioWhatsAppCredentials();
    },

    async send(to: string, message: string): Promise<ChannelResult> {
      if (hasMetaCredentials()) {
        return sendViaMeta(to, message);
      }

      if (hasTwilioWhatsAppCredentials()) {
        return sendViaTwilio(to, message);
      }

      console.log(`[WHATSAPP][DEV] To: ${toMsisdn(to)} | Click to send: ${whatsappShareUrl(to, message)}`);
      return {
        ok: false,
        provider: "dev",
        error: "No WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID or TWILIO_WHATSAPP_FROM configured",
      };
    },

    async sendLocation(to: string, location: WhatsAppLocation): Promise<ChannelResult> {
      const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
      if (!token || !phoneNumberId) {
        return { ok: false, provider: "dev", error: "Cloud API not configured" };
      }

      const version = process.env.WHATSAPP_API_VERSION?.trim() || "v22.0";
      const res = await fetchWithTimeout(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: toMsisdn(to),
            type: "location",
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              name: location.name,
              address: location.address,
            },
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        console.error(`[WHATSAPP][META] Location send failed to ${toMsisdn(to)}: ${body}`);
        return { ok: false, provider: "meta", error: body };
      }
      return { ok: true, provider: "meta" };
    },
  };
}
