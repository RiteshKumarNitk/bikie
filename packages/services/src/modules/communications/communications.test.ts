import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDistance, mapsNavigateUrl, mapsPinUrl } from "../../sos-maps";
import { isValidIndianMobile, toE164Phone } from "./domain/phone";
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

  it("validates Indian mobile numbers", () => {
    expect(isValidIndianMobile("9876543210")).toBe(true);
    expect(isValidIndianMobile("+91 98765 43210")).toBe(true);
    expect(isValidIndianMobile("919876543210")).toBe(true);
    expect(isValidIndianMobile("1234567890")).toBe(false); // doesn't start 6-9
    expect(isValidIndianMobile("98765432")).toBe(false); // too short
    expect(isValidIndianMobile("+1 9876543210")).toBe(false); // not +91
    expect(isValidIndianMobile("")).toBe(false);
  });

  it("builds Meta MSISDN and wa.me links", () => {
    expect(toMsisdn("9876543210")).toBe("919876543210");
    expect(whatsappShareUrl("9876543210", "hello")).toBe(
      `https://wa.me/919876543210?text=${encodeURIComponent("hello")}`,
    );
  });
});

describe("communications adapters (DEV fallback)", () => {
  it("SMS logs DEV when MSG91 is unset", async () => {
    const keys = ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_ROUTE", "MSG91_TEMPLATE_ID"];
    const prev = snapshotEnv(keys);
    clearEnv(keys);

    const result = await createSmsAdapter().send("+919876543210", "test");
    expect(result).toEqual({
      ok: false,
      provider: "dev",
      error: "MSG91 credentials not configured",
    });

    restoreEnv(prev);
  });

  describe("SMS DLT_TE_ID resolution (ADR-058 / one template per SMS type)", () => {
    const keys = ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_ROUTE", "MSG91_TEMPLATE_ID"];
    let prev: Record<string, string | undefined>;

    afterEach(() => {
      restoreEnv(prev);
      vi.unstubAllGlobals();
    });

    it("uses the explicit templateId as DLT_TE_ID verbatim", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";
      process.env.MSG91_TEMPLATE_ID = "sos-default-template";

      const fetchSpy = vi.fn(async (_input: string | URL, _init?: RequestInit) => new Response('{"type":"success"}', { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);

      await createSmsAdapter().send("+919876543210", "Hello Rider Priya; ...", "membership-sub-template");

      const [, init] = fetchSpy.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.sms[0].DLT_TE_ID).toBe("membership-sub-template");
    });

    it("NEVER borrows MSG91_TEMPLATE_ID — a send with no templateId goes out with no DLT_TE_ID and warns", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";
      process.env.MSG91_TEMPLATE_ID = "some-other-template";

      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const fetchSpy = vi.fn(async (_input: string | URL, _init?: RequestInit) => new Response('{"type":"success"}', { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);

      await createSmsAdapter().send("+919876543210", "BIKIE SOS: alert");

      const [, init] = fetchSpy.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.sms[0].DLT_TE_ID).toBeUndefined();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("no DLT template id"));
      warn.mockRestore();
    });

    it("returns MSG91's request id as `detail` on a successful send (gateway acceptance trace, ADR-079)", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";

      const fetchSpy = vi.fn(
        async () => new Response('{"type":"success","message":"3b8f1a2c-req-id"}', { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchSpy);

      const res = await createSmsAdapter().send("+919876543210", "Hello Rider ...", "bikie-sub-tmpl", "membership-subscribed");
      expect(res).toMatchObject({ ok: true, provider: "msg91", detail: "3b8f1a2c-req-id" });
    });

    it("classifies an MSG91 rejection into an operator-actionable reason (ADR-079, §13)", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "bad";
      process.env.MSG91_SENDER_ID = "KSHIDL";
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      const cases: Array<[number, string, RegExp]> = [
        [401, '{"type":"error","message":"authkey not valid"}', /auth key/i],
        [200, '{"type":"error","message":"DLT_TE_ID content mismatch"}', /template/i],
        [200, '{"type":"error","message":"invalid mobile number"}', /recipient number/i],
        [200, '{"type":"error","message":"sender id not approved"}', /sender id/i],
      ];
      for (const [status, payload, expected] of cases) {
        vi.stubGlobal("fetch", vi.fn(async () => new Response(payload, { status })));
        const res = await createSmsAdapter().send("+919876543210", "x", "tmpl", "sos-help");
        expect(res.ok).toBe(false);
        expect(res.error).toMatch(expected);
      }
      err.mockRestore();
    });

    it("logs the exact serialized request payload (DLT_TE_ID + sender) before fetch, with the phone masked — never the raw number", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const fetchSpy = vi.fn(async (_input: string | URL, _init?: RequestInit) => new Response('{"type":"success","message":"req-1"}', { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);

      // The real SOS DLT template id (ADR-087 investigation) — used here, not a placeholder,
      // so this test directly proves the exact production value gets serialized correctly.
      const SOS_TEMPLATE_ID = "1077556920001446300";
      await createSmsAdapter().send("+918946887702", "SOS body", SOS_TEMPLATE_ID, "sos-help");

      // What was actually transmitted to MSG91 — the real phone number, unmasked (masking is a
      // logging-only concern, must never touch the actual wire request).
      const [, init] = fetchSpy.mock.calls[0];
      const sentBody = JSON.parse((init as RequestInit).body as string);
      expect(sentBody.sender).toBe("KSHIDL");
      expect(sentBody.sms[0].DLT_TE_ID).toBe(SOS_TEMPLATE_ID);
      expect(sentBody.sms[0].to).toEqual(["918946887702"]);

      // What was logged — same DLT_TE_ID/sender, but the phone number masked.
      const requestLogCall = log.mock.calls.find((call) => String(call[0]).includes("[SMS][MSG91][REQUEST]"));
      expect(requestLogCall).toBeDefined();
      const loggedJson = String(requestLogCall![0]).replace(/^\[SMS\]\[MSG91\]\[REQUEST\] \[sos-help\] /, "");
      const logged = JSON.parse(loggedJson);
      expect(logged.sender).toBe("KSHIDL");
      expect(logged.sms[0].DLT_TE_ID).toBe(SOS_TEMPLATE_ID);
      expect(logged.sms[0].to[0]).not.toBe("918946887702");
      expect(logged.sms[0].to[0]).not.toContain("887702");
      log.mockRestore();
    });
  });

  describe("SMS Flow API (MSG91 v5/flow — SOS dispatch transport)", () => {
    const keys = ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_ROUTE"];
    let prev: Record<string, string | undefined>;

    afterEach(() => {
      restoreEnv(prev);
      vi.unstubAllGlobals();
    });

    it("posts to the Flow endpoint with the template id, normalized phone, and variables — no DLT_TE_ID anywhere", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";

      const fetchSpy = vi.fn(async (_input: string | URL, _init?: RequestInit) => new Response('{"type":"success","message":"flow-req-1"}', { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);

      const SOS_FLOW_TEMPLATE_ID = "6a7b54abd6f241632f0bc273";
      await createSmsAdapter().sendFlow(
        "+918946887702",
        SOS_FLOW_TEMPLATE_ID,
        { alphanumeric1: "Mohit kumar sharma", alphanumeric2: "N/A", alphanumeric3: "Kartarpura" },
        "sos-help",
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://control.msg91.com/api/v5/flow"); // A

      const sentBody = JSON.parse((init as RequestInit).body as string);
      expect(sentBody.template_id).toBe(SOS_FLOW_TEMPLATE_ID); // B
      expect(sentBody.recipients).toHaveLength(1);
      expect(sentBody.recipients[0].mobiles).toBe("918946887702"); // C — leading + stripped, no 0091/9191
      expect(sentBody.recipients[0].alphanumeric1).toBe("Mohit kumar sharma"); // D
      expect(sentBody.recipients[0].alphanumeric2).toBe("N/A");
      expect(sentBody.recipients[0].alphanumeric3).toBe("Kartarpura");
      expect(JSON.stringify(sentBody)).not.toContain("DLT_TE_ID"); // E

      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers.authkey).toBe("test-authkey"); // sent in the header...
      expect(JSON.stringify(sentBody)).not.toContain("test-authkey"); // ...never in the body
    });

    it("never logs the auth key — request/success/error log lines are all free of it (F)", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "super-secret-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const err = vi.spyOn(console, "error").mockImplementation(() => {});
      const fetchSpy = vi.fn(async () => new Response('{"type":"success","message":"flow-req-2"}', { status: 200 }));
      vi.stubGlobal("fetch", fetchSpy);

      await createSmsAdapter().sendFlow("+918946887702", "6a7b54abd6f241632f0bc273", { alphanumeric1: "x" }, "sos-help");

      const allLoggedText = [...log.mock.calls, ...err.mock.calls].map((c) => c.join(" ")).join("\n");
      expect(allLoggedText).not.toContain("super-secret-authkey");

      log.mockRestore();
      err.mockRestore();
    });

    it("masks the phone number in the [SMS][MSG91][FLOW][REQUEST] diagnostic log line", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn(async () => new Response('{"type":"success","message":"req-3"}', { status: 200 })));

      await createSmsAdapter().sendFlow("+918946887702", "6a7b54abd6f241632f0bc273", { alphanumeric1: "x" }, "sos-help");

      const requestLogCall = log.mock.calls.find((call) => String(call[0]).includes("[SMS][MSG91][FLOW][REQUEST]"));
      expect(requestLogCall).toBeDefined();
      const loggedJson = String(requestLogCall![0]).replace(/^\[SMS\]\[MSG91\]\[FLOW\]\[REQUEST\] \[sos-help\] /, "");
      const logged = JSON.parse(loggedJson);
      expect(logged.recipients[0].mobiles).not.toBe("918946887702");
      expect(logged.recipients[0].mobiles).not.toContain("887702".slice(0, -4)); // masked, not the raw digits

      log.mockRestore();
    });

    it("distinguishes API acceptance from handset delivery, and returns MSG91's request id as `detail`", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "test-authkey";
      process.env.MSG91_SENDER_ID = "KSHIDL";

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn(async () => new Response('{"type":"success","message":"flow-req-4"}', { status: 200 })));

      const res = await createSmsAdapter().sendFlow("+918946887702", "6a7b54abd6f241632f0bc273", { alphanumeric1: "x" }, "sos-help");

      expect(res).toMatchObject({ ok: true, provider: "msg91", detail: "flow-req-4" });
      const acceptedLog = log.mock.calls.find((call) => String(call[0]).includes("[SMS][MSG91][FLOW] "));
      expect(acceptedLog).toBeDefined();
      expect(String(acceptedLog![0])).toContain("API accepted, not proof of handset delivery");

      log.mockRestore();
    });

    it("falls back to DEV (does not call fetch) when MSG91 credentials are unset, phone still masked", async () => {
      prev = snapshotEnv(keys);
      clearEnv(keys);

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      const res = await createSmsAdapter().sendFlow("+918946887702", "6a7b54abd6f241632f0bc273", { alphanumeric1: "x" });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(res).toEqual({ ok: false, provider: "dev", error: "MSG91 credentials not configured" });
      const devLog = log.mock.calls.find((call) => String(call[0]).includes("[SMS][DEV][FLOW]"));
      expect(devLog).toBeDefined();
      expect(String(devLog![0])).not.toContain("918946887702");

      log.mockRestore();
    });

    it("classifies an MSG91 Flow rejection the same way as v2 (auth/sender/number/balance)", async () => {
      prev = snapshotEnv(keys);
      process.env.MSG91_AUTH_KEY = "bad";
      process.env.MSG91_SENDER_ID = "KSHIDL";
      const err = vi.spyOn(console, "error").mockImplementation(() => {});

      vi.stubGlobal("fetch", vi.fn(async () => new Response('{"type":"error","message":"authkey not valid"}', { status: 401 })));
      const res = await createSmsAdapter().sendFlow("+918946887702", "6a7b54abd6f241632f0bc273", { alphanumeric1: "x" }, "sos-help");

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/auth key/i);
      err.mockRestore();
    });
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
