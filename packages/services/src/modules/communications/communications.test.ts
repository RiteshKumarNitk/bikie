import { describe, expect, it } from "vitest";
import { formatDistance, mapsNavigateUrl, mapsPinUrl } from "../../sos-maps";
import { toE164Phone } from "./domain/phone";
import {
  createWhatsAppAdapter,
  toMsisdn,
  whatsappShareUrl,
} from "./infrastructure/whatsapp.adapter";
import { createSmsAdapter } from "./infrastructure/sms.adapter";
import { createEmailAdapter } from "./infrastructure/email.adapter";

function snapshotEnv(keys: string[]) {
  const prev: Record<string, string | undefined> = {};
  for (const key of keys) prev[key] = process.env[key];
  return prev;
}

function restoreEnv(prev: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(prev)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearEnv(keys: string[]) {
  for (const key of keys) delete process.env[key];
}

describe("SOS map helpers", () => {
  it("builds pin and navigate URLs", () => {
    expect(mapsPinUrl(12.9716, 77.5946)).toBe("https://maps.google.com/?q=12.9716,77.5946");
    expect(mapsNavigateUrl(12.9716, 77.5946)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946",
    );
  });

  it("formats distances", () => {
    expect(formatDistance(undefined)).toBeNull();
    expect(formatDistance(420)).toBe("420 m away");
    expect(formatDistance(2500)).toBe("2.5 km away");
  });
});

describe("phone normalization", () => {
  it("normalizes Indian numbers to E.164", () => {
    expect(toE164Phone("9876543210")).toBe("+919876543210");
    expect(toE164Phone("+91 98765 43210")).toBe("+919876543210");
    expect(toE164Phone("919876543210")).toBe("+919876543210");
    expect(toE164Phone("whatsapp:+919876543210")).toBe("+919876543210");
  });

  it("builds Meta MSISDN and wa.me links", () => {
    expect(toMsisdn("9876543210")).toBe("919876543210");
    expect(whatsappShareUrl("9876543210", "hello")).toBe(
      `https://wa.me/919876543210?text=${encodeURIComponent("hello")}`,
    );
  });
});

describe("communications adapters (DEV fallback)", () => {
  it("SMS logs DEV when Twilio is unset", async () => {
    const keys = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_FROM_NUMBER",
      "TWILIO_MESSAGING_SERVICE_SID",
    ];
    const prev = snapshotEnv(keys);
    clearEnv(keys);

    const result = await createSmsAdapter().send("+919876543210", "test");
    expect(result).toEqual({
      ok: false,
      provider: "dev",
      error: "Twilio credentials not configured",
    });

    restoreEnv(prev);
  });

  it("Email logs DEV when SMTP and Resend are unset", async () => {
    const keys = ["SMTP_USER", "SMTP_PASS", "RESEND_API_KEY"];
    const prev = snapshotEnv(keys);
    clearEnv(keys);

    const result = await createEmailAdapter().send({
      to: "rider@example.com",
      subject: "hi",
      html: "<p>hi</p>",
    });
    expect(result.ok).toBe(false);
    expect(result.provider).toBe("dev");

    restoreEnv(prev);
  });

  it("WhatsApp returns DEV when credentials unset", async () => {
    const keys = [
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "TWILIO_WHATSAPP_FROM",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
    ];
    const prev = snapshotEnv(keys);
    clearEnv(keys);

    const result = await createWhatsAppAdapter().send("+919876543210", "SOS help");
    expect(result.ok).toBe(false);
    expect(result.provider).toBe("dev");

    restoreEnv(prev);
  });
});
