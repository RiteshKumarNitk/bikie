import { afterEach, describe, expect, it, vi } from "vitest";
import { createMsg91NativeOtpAdapter } from "./infrastructure/msg91-native-otp.adapter";
import { createMsg91WidgetVerifyAdapter } from "./infrastructure/msg91-widget-verify.adapter";

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

const OTP_ENV_KEYS = ["MSG91_AUTH_KEY", "MSG91_OTP_TEMPLATE_ID"];

describe("MSG91 native OTP adapter (ADR-034)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("DEV fallback: send returns not-configured without calling fetch when unset", async () => {
    const prev = snapshotEnv(OTP_ENV_KEYS);
    clearEnv(OTP_ENV_KEYS);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createMsg91NativeOtpAdapter().send("+919876543210", {
      otpLength: 6,
      expirySeconds: 300,
    });

    expect(result).toEqual({ ok: false, provider: "dev", error: "MSG91 OTP credentials not configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
    restoreEnv(prev);
  });

  it("DEV fallback: verify returns false without calling fetch when unset", async () => {
    const prev = snapshotEnv(OTP_ENV_KEYS);
    clearEnv(OTP_ENV_KEYS);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createMsg91NativeOtpAdapter().verify("+919876543210", "123456");

    expect(result).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    restoreEnv(prev);
  });

  it("send treats HTTP 200 with a 'type':'error' body as a failure (MSG91's status quirk)", async () => {
    const prev = snapshotEnv(OTP_ENV_KEYS);
    process.env.MSG91_AUTH_KEY = "test-key";
    process.env.MSG91_OTP_TEMPLATE_ID = "test-template";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"type":"error","message":"invalid mobile"}', { status: 200 })),
    );

    const result = await createMsg91NativeOtpAdapter().send("+919876543210", {
      otpLength: 6,
      expirySeconds: 300,
    });

    expect(result.ok).toBe(false);
    expect(result.provider).toBe("msg91");
    restoreEnv(prev);
  });

  it("send treats HTTP 200 with a 'type':'success' body as delivered", async () => {
    const prev = snapshotEnv(OTP_ENV_KEYS);
    process.env.MSG91_AUTH_KEY = "test-key";
    process.env.MSG91_OTP_TEMPLATE_ID = "test-template";
    const fetchSpy = vi.fn(async (_input: string | URL, _init?: RequestInit) =>
      new Response('{"type":"success","message":"req-id-123"}', { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createMsg91NativeOtpAdapter().send("+919876543210", {
      otpLength: 6,
      expirySeconds: 300,
    });

    expect(result).toEqual({ ok: true, provider: "msg91" });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("otp_length=6");
    expect(String(url)).toContain("otp_expiry=5");
    expect(init?.headers).toMatchObject({ authkey: "test-key" });
    restoreEnv(prev);
  });

  it("verify returns true only on a 'type':'success' body", async () => {
    const prev = snapshotEnv(OTP_ENV_KEYS);
    process.env.MSG91_AUTH_KEY = "test-key";
    process.env.MSG91_OTP_TEMPLATE_ID = "test-template";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"type":"success","message":"otp verified"}', { status: 200 })),
    );

    const result = await createMsg91NativeOtpAdapter().verify("+919876543210", "123456");

    expect(result).toBe(true);
    restoreEnv(prev);
  });
});

describe("MSG91 widget verify adapter (ADR-034)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("DEV fallback: returns unverified without calling fetch when MSG91_AUTH_KEY is unset", async () => {
    const prev = snapshotEnv(["MSG91_AUTH_KEY"]);
    clearEnv(["MSG91_AUTH_KEY"]);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createMsg91WidgetVerifyAdapter().verifyAccessToken("some-token");

    expect(result).toEqual({ verified: false, phoneNumber: null });
    expect(fetchSpy).not.toHaveBeenCalled();
    restoreEnv(prev);
  });

  it("returns verified:false on a 'type':'error' body", async () => {
    const prev = snapshotEnv(["MSG91_AUTH_KEY"]);
    process.env.MSG91_AUTH_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"type":"error","message":"invalid token"}', { status: 200 })),
    );

    const result = await createMsg91WidgetVerifyAdapter().verifyAccessToken("bad-token");

    expect(result).toEqual({ verified: false, phoneNumber: null });
    restoreEnv(prev);
  });

  it("returns verified:true and parses a mobile field when present", async () => {
    const prev = snapshotEnv(["MSG91_AUTH_KEY"]);
    process.env.MSG91_AUTH_KEY = "test-key";
    const fetchSpy = vi.fn(
      async (_input: string | URL, _init?: RequestInit) =>
        new Response('{"type":"success","message":"ok","mobile":"919876543210"}', { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const result = await createMsg91WidgetVerifyAdapter().verifyAccessToken("good-token");

    expect(result).toEqual({ verified: true, phoneNumber: "919876543210" });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toBe("https://control.msg91.com/api/v5/widget/verifyAccessToken");
    expect(JSON.parse(init?.body as string)).toEqual({
      authkey: "test-key",
      "access-token": "good-token",
    });
    restoreEnv(prev);
  });

  it("returns verified:true with phoneNumber:null when no recognizable phone field is present", async () => {
    const prev = snapshotEnv(["MSG91_AUTH_KEY"]);
    process.env.MSG91_AUTH_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"type":"success"}', { status: 200 })));

    const result = await createMsg91WidgetVerifyAdapter().verifyAccessToken("good-token");

    expect(result).toEqual({ verified: true, phoneNumber: null });
    restoreEnv(prev);
  });
});
