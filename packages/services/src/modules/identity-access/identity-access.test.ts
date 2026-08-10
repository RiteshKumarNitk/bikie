import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  membershipRepository: { getActiveMembership: vi.fn(async () => null) },
}));

import { isAccountRestricted } from "./domain/account-status";
import { hasPermission, permissionsForRole } from "./domain/permissions";
import { hasRole, isAdmin } from "./domain/roles";
import { createIdentityAccessModule } from "./public";
import type { ChannelResult } from "../communications/ports";
import type { IdentityAccessPorts, SessionSnapshot } from "./ports";

function fakePorts(overrides: Partial<IdentityAccessPorts> = {}): IdentityAccessPorts {
  return {
    membership: { hasActiveMembership: vi.fn(async () => false) },
    otpEcho: { remember: vi.fn(async () => undefined), recall: vi.fn(async () => null) },
    msg91NativeOtp: {
      send: vi.fn(async (): Promise<ChannelResult> => ({ ok: true, provider: "msg91" })),
      verify: vi.fn(async () => true),
    },
    msg91WidgetVerify: {
      verifyAccessToken: vi.fn(async () => ({ verified: true, phoneNumber: null })),
    },
    ...overrides,
  };
}

function session(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot {
  return {
    userId: "user-1",
    role: "RENTER",
    accountStatus: "ACTIVE",
    accountStatusExpiresAt: null,
    ...overrides,
  };
}

describe("account status policy", () => {
  const now = new Date("2026-08-02T00:00:00Z");

  it("blocks banned accounts regardless of expiry", () => {
    expect(isAccountRestricted({ status: "BANNED", expiresAt: null }, now)).toBe(true);
    expect(isAccountRestricted({ status: "BANNED", expiresAt: "2020-01-01T00:00:00Z" }, now)).toBe(true);
  });

  it("blocks suspensions until they expire", () => {
    expect(isAccountRestricted({ status: "SUSPENDED", expiresAt: null }, now)).toBe(true);
    expect(isAccountRestricted({ status: "SUSPENDED", expiresAt: "2026-09-01T00:00:00Z" }, now)).toBe(true);
    expect(isAccountRestricted({ status: "SUSPENDED", expiresAt: "2026-07-01T00:00:00Z" }, now)).toBe(false);
  });

  it("allows active and unknown statuses", () => {
    expect(isAccountRestricted({ status: "ACTIVE", expiresAt: null }, now)).toBe(false);
    expect(isAccountRestricted({ status: null, expiresAt: null }, now)).toBe(false);
    expect(isAccountRestricted({ status: "MUTED", expiresAt: null }, now)).toBe(false);
  });
});

describe("role and permission policy", () => {
  it("matches a single role or any role in a list", () => {
    expect(hasRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("PARTNER", ["ADMIN", "PARTNER"])).toBe(true);
    expect(hasRole("RENTER", ["ADMIN", "PARTNER"])).toBe(false);
    expect(hasRole(null, "ADMIN")).toBe(false);
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("PARTNER")).toBe(false);
  });

  it("derives permissions from role without widening access", () => {
    expect(hasPermission("RENTER", "sos:create")).toBe(true);
    expect(hasPermission("RENTER", "user:manage")).toBe(false);
    expect(hasPermission("PARTNER", "fleet:manage")).toBe(true);
    expect(hasPermission("PARTNER", "moderation:manage")).toBe(false);
    expect(hasPermission("ADMIN", "user:manage")).toBe(true);
    expect(hasPermission("ADMIN", "sos:view:any")).toBe(true);
    expect(permissionsForRole("UNKNOWN")).toEqual([]);
  });

  it("gives ADMIN a superset of PARTNER, and PARTNER a superset of RENTER", () => {
    const renter = permissionsForRole("RENTER");
    const partner = permissionsForRole("PARTNER");
    const admin = permissionsForRole("ADMIN");
    expect(renter.every((p) => partner.includes(p))).toBe(true);
    expect(partner.every((p) => admin.includes(p))).toBe(true);
  });
});

describe("access application", () => {
  it("denies UNAUTHENTICATED with no session", () => {
    const { access } = createIdentityAccessModule(fakePorts());
    expect(access.evaluateSession(null)).toEqual({ allowed: false, reason: "UNAUTHENTICATED" });
  });

  it("denies ACCOUNT_RESTRICTED before checking role", () => {
    const { access } = createIdentityAccessModule(fakePorts());
    expect(access.evaluateRole(session({ role: "ADMIN", accountStatus: "BANNED" }), "ADMIN")).toEqual({
      allowed: false,
      reason: "ACCOUNT_RESTRICTED",
    });
  });

  it("denies FORBIDDEN on role mismatch and allows on match", () => {
    const { access } = createIdentityAccessModule(fakePorts());
    expect(access.evaluateRole(session(), "ADMIN")).toEqual({ allowed: false, reason: "FORBIDDEN" });
    expect(access.evaluateRole(session({ role: "PARTNER" }), ["ADMIN", "PARTNER"])).toEqual({
      allowed: true,
    });
  });

  it("lets ADMIN bypass membership without hitting the repository", async () => {
    const hasActiveMembership = vi.fn(async () => false);
    const { access } = createIdentityAccessModule(
      fakePorts({ membership: { hasActiveMembership } }),
    );

    await expect(access.evaluateMembership(session({ role: "ADMIN" }))).resolves.toEqual({
      allowed: true,
    });
    expect(hasActiveMembership).not.toHaveBeenCalled();
  });

  it("requires an active membership for non-admins", async () => {
    const withoutMembership = createIdentityAccessModule(
      fakePorts({ membership: { hasActiveMembership: vi.fn(async () => false) } }),
    );
    await expect(withoutMembership.access.evaluateMembership(session())).resolves.toEqual({
      allowed: false,
      reason: "MEMBERSHIP_REQUIRED",
    });

    const withMembership = createIdentityAccessModule(
      fakePorts({ membership: { hasActiveMembership: vi.fn(async () => true) } }),
    );
    await expect(withMembership.access.evaluateMembership(session())).resolves.toEqual({
      allowed: true,
    });
  });

  it("fails restricted accounts before the membership lookup", async () => {
    const hasActiveMembership = vi.fn(async () => true);
    const { access } = createIdentityAccessModule(
      fakePorts({ membership: { hasActiveMembership } }),
    );

    await expect(access.evaluateMembership(session({ accountStatus: "BANNED" }))).resolves.toEqual({
      allowed: false,
      reason: "ACCOUNT_RESTRICTED",
    });
    expect(hasActiveMembership).not.toHaveBeenCalled();
  });

  it("evaluates permissions through the same session gate", () => {
    const { access } = createIdentityAccessModule(fakePorts());
    expect(access.evaluatePermission(null, "user:manage")).toEqual({
      allowed: false,
      reason: "UNAUTHENTICATED",
    });
    expect(access.evaluatePermission(session(), "user:manage")).toEqual({
      allowed: false,
      reason: "FORBIDDEN",
    });
    expect(access.evaluatePermission(session({ role: "ADMIN" }), "user:manage")).toEqual({
      allowed: true,
    });
  });
});

describe("Service Provider capability, decoupled from verification (ADR-049)", () => {
  it("denies with no session or a restricted account, before checking anything partner-related", async () => {
    const { access } = createIdentityAccessModule(fakePorts());
    await expect(access.evaluatePartnerCapability(null)).resolves.toEqual({
      allowed: false,
      reason: "UNAUTHENTICATED",
    });
    await expect(
      access.evaluatePartnerCapability(session({ partnerStatus: "APPROVED", accountStatus: "BANNED" })),
    ).resolves.toEqual({ allowed: false, reason: "ACCOUNT_RESTRICTED" });
  });

  it("denies an account with no Partner profile at all", async () => {
    const { access } = createIdentityAccessModule(fakePorts());
    await expect(access.evaluatePartnerCapability(session({ partnerStatus: null }))).resolves.toEqual({
      allowed: false,
      reason: "PARTNER_NOT_APPROVED",
    });
  });

  it("denies a SUSPENDED profile — the one verification state that also revokes capability", async () => {
    const { access } = createIdentityAccessModule(
      fakePorts({ membership: { hasActiveMembership: vi.fn(async () => true) } }),
    );
    await expect(access.evaluatePartnerCapability(session({ partnerStatus: "SUSPENDED" }))).resolves.toEqual({
      allowed: false,
      reason: "PARTNER_NOT_APPROVED",
    });
  });

  it.each(["DRAFT", "PENDING_VERIFICATION", "MORE_INFORMATION_REQUIRED", "REJECTED", "APPROVED"])(
    "grants capability for verificationStatus=%s as long as membership is active — verification is never the gate",
    async (partnerStatus) => {
      const { access } = createIdentityAccessModule(
        fakePorts({ membership: { hasActiveMembership: vi.fn(async () => true) } }),
      );
      await expect(access.evaluatePartnerCapability(session({ partnerStatus }))).resolves.toEqual({
        allowed: true,
      });
    },
  );

  it("still requires active membership, independent of profile/verification state", async () => {
    const { access } = createIdentityAccessModule(
      fakePorts({ membership: { hasActiveMembership: vi.fn(async () => false) } }),
    );
    await expect(access.evaluatePartnerCapability(session({ partnerStatus: "DRAFT" }))).resolves.toEqual({
      allowed: false,
      reason: "MEMBERSHIP_REQUIRED",
    });
  });

  describe("hasPartnerCapabilitySync (cheap, session-only, for UI mode-routing)", () => {
    const { access } = createIdentityAccessModule(fakePorts());

    it("is false with no session, a restricted account, no profile, or SUSPENDED", () => {
      expect(access.hasPartnerCapabilitySync(null)).toBe(false);
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: "APPROVED", accountStatus: "BANNED" }))).toBe(
        false,
      );
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: null }))).toBe(false);
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: "SUSPENDED" }))).toBe(false);
    });

    it("is true for any non-null, non-SUSPENDED profile — no membership lookup involved", () => {
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: "DRAFT" }))).toBe(true);
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: "PENDING_VERIFICATION" }))).toBe(true);
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: "REJECTED" }))).toBe(true);
      expect(access.hasPartnerCapabilitySync(session({ partnerStatus: "APPROVED" }))).toBe(true);
    });
  });
});

describe("otp send/verify applications (ADR-034)", () => {
  const originalShowOtpToast = process.env.SHOW_OTP_TOAST;

  afterEach(() => {
    if (originalShowOtpToast === undefined) delete process.env.SHOW_OTP_TOAST;
    else process.env.SHOW_OTP_TOAST = originalShowOtpToast;
  });

  describe("sendNativeLoginOtp", () => {
    it("calls MSG91's native send API with otpLength=6 when the dev bypass is off", async () => {
      delete process.env.SHOW_OTP_TOAST;
      const send = vi.fn(async (): Promise<ChannelResult> => ({ ok: true, provider: "msg91" }));
      const remember = vi.fn(async () => undefined);
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send, verify: vi.fn() }, otpEcho: { remember, recall: vi.fn() } }),
      );

      const result = await otp.sendNativeLoginOtp({ phoneNumber: "+919876543210" });

      expect(send).toHaveBeenCalledWith("+919876543210", { otpLength: 6, expirySeconds: 300 });
      expect(remember).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true, provider: "msg91" });
    });

    it("skips MSG91 entirely and remembers a local code when the dev bypass is on", async () => {
      process.env.SHOW_OTP_TOAST = "true";
      const send = vi.fn(async (): Promise<ChannelResult> => ({ ok: true, provider: "msg91" }));
      const remember = vi.fn(async (_phone: string, _code: string, _ttl: number) => undefined);
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send, verify: vi.fn() }, otpEcho: { remember, recall: vi.fn() } }),
      );

      const result = await otp.sendNativeLoginOtp({ phoneNumber: "+919876543210" });

      expect(send).not.toHaveBeenCalled();
      expect(remember).toHaveBeenCalledTimes(1);
      const [phone, code, ttl] = remember.mock.calls[0]!;
      expect(phone).toBe("+919876543210");
      expect(code).toMatch(/^\d{6}$/);
      expect(ttl).toBe(300);
      expect(result).toEqual({ ok: true, provider: "dev-bypass" });
    });
  });

  describe("verifyLoginOtp", () => {
    it("trusts a recalled dev-bypass code exclusively, without calling MSG91", async () => {
      const recall = vi.fn(async () => "654321");
      const nativeVerify = vi.fn(async () => true);
      const widgetVerify = vi.fn(async () => ({ verified: true, phoneNumber: null }));
      const { otp } = createIdentityAccessModule(
        fakePorts({
          otpEcho: { remember: vi.fn(), recall },
          msg91NativeOtp: { send: vi.fn(), verify: nativeVerify },
          msg91WidgetVerify: { verifyAccessToken: widgetVerify },
        }),
      );

      await expect(otp.verifyLoginOtp({ phoneNumber: "+919876543210", code: "654321" })).resolves.toBe(true);
      await expect(otp.verifyLoginOtp({ phoneNumber: "+919876543210", code: "000000" })).resolves.toBe(false);
      expect(nativeVerify).not.toHaveBeenCalled();
      expect(widgetVerify).not.toHaveBeenCalled();
    });

    it("routes short numeric codes to MSG91's native verify (mobile)", async () => {
      const nativeVerify = vi.fn(async () => true);
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send: vi.fn(), verify: nativeVerify } }),
      );

      const result = await otp.verifyLoginOtp({ phoneNumber: "+919876543210", code: "123456" });

      expect(nativeVerify).toHaveBeenCalledWith("+919876543210", "123456");
      expect(result).toBe(true);
    });

    it("routes opaque non-numeric codes to MSG91's widget verifyAccessToken (web)", async () => {
      const widgetVerify = vi.fn(async () => ({ verified: true, phoneNumber: null }));
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91WidgetVerify: { verifyAccessToken: widgetVerify } }),
      );

      const result = await otp.verifyLoginOtp({
        phoneNumber: "+919876543210",
        code: "opaque-widget-token-abc123",
      });

      expect(widgetVerify).toHaveBeenCalledWith("opaque-widget-token-abc123");
      expect(result).toBe(true);
    });

    it("rejects a widget token verified for a different phone number than claimed", async () => {
      const { otp } = createIdentityAccessModule(
        fakePorts({
          msg91WidgetVerify: {
            verifyAccessToken: vi.fn(async () => ({ verified: true, phoneNumber: "+919999999999" })),
          },
        }),
      );

      const result = await otp.verifyLoginOtp({ phoneNumber: "+919876543210", code: "opaque-token" });

      expect(result).toBe(false);
    });

    it("rejects when the widget itself reports the token as unverified", async () => {
      const { otp } = createIdentityAccessModule(
        fakePorts({
          msg91WidgetVerify: { verifyAccessToken: vi.fn(async () => ({ verified: false, phoneNumber: null })) },
        }),
      );

      const result = await otp.verifyLoginOtp({ phoneNumber: "+919876543210", code: "opaque-token" });

      expect(result).toBe(false);
    });
  });

  describe("fixed test-number bypass (TEST_RIDER_PHONE/TEST_SERVICE_PROVIDER_PHONE/TEST_OTP)", () => {
    const originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      TEST_RIDER_PHONE: process.env.TEST_RIDER_PHONE,
      TEST_SERVICE_PROVIDER_PHONE: process.env.TEST_SERVICE_PROVIDER_PHONE,
      TEST_OTP: process.env.TEST_OTP,
    };

    afterEach(() => {
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });

    it("accepts the fixed TEST_OTP for a configured test rider phone without calling MSG91", async () => {
      process.env.NODE_ENV = "development";
      process.env.TEST_RIDER_PHONE = "+919876500001";
      process.env.TEST_OTP = "123456";
      const nativeVerify = vi.fn(async () => true);
      const widgetVerify = vi.fn(async () => ({ verified: true, phoneNumber: null }));
      const { otp } = createIdentityAccessModule(
        fakePorts({
          msg91NativeOtp: { send: vi.fn(), verify: nativeVerify },
          msg91WidgetVerify: { verifyAccessToken: widgetVerify },
        }),
      );

      const result = await otp.verifyLoginOtp({ phoneNumber: "+919876500001", code: "123456" });

      expect(result).toBe(true);
      expect(nativeVerify).not.toHaveBeenCalled();
      expect(widgetVerify).not.toHaveBeenCalled();
    });

    it("rejects a wrong code for a test phone without ever falling through to MSG91", async () => {
      process.env.NODE_ENV = "development";
      process.env.TEST_SERVICE_PROVIDER_PHONE = "+919876500002";
      process.env.TEST_OTP = "123456";
      const nativeVerify = vi.fn(async () => true);
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send: vi.fn(), verify: nativeVerify } }),
      );

      const result = await otp.verifyLoginOtp({ phoneNumber: "+919876500002", code: "000000" });

      expect(result).toBe(false);
      expect(nativeVerify).not.toHaveBeenCalled();
    });

    it("never bypasses in production, even for a configured test number and correct code", async () => {
      process.env.NODE_ENV = "production";
      process.env.TEST_RIDER_PHONE = "+919876500001";
      process.env.TEST_OTP = "123456";
      const nativeVerify = vi.fn(async () => false);
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send: vi.fn(), verify: nativeVerify } }),
      );

      const result = await otp.verifyLoginOtp({ phoneNumber: "+919876500001", code: "123456" });

      expect(nativeVerify).toHaveBeenCalledWith("+919876500001", "123456");
      expect(result).toBe(false);
    });

    it("skips MSG91's native send for a configured test number and reports test-bypass", async () => {
      process.env.NODE_ENV = "development";
      process.env.TEST_SERVICE_PROVIDER_PHONE = "+919876500002";
      const send = vi.fn(async (): Promise<ChannelResult> => ({ ok: true, provider: "msg91" }));
      const remember = vi.fn(async () => undefined);
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send, verify: vi.fn() }, otpEcho: { remember, recall: vi.fn() } }),
      );

      const result = await otp.sendNativeLoginOtp({ phoneNumber: "+919876500002" });

      expect(send).not.toHaveBeenCalled();
      expect(remember).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true, provider: "test-bypass" });
    });

    it("leaves a non-test phone number on the normal MSG91 send path", async () => {
      process.env.NODE_ENV = "development";
      process.env.TEST_RIDER_PHONE = "+919876500001";
      const send = vi.fn(async (): Promise<ChannelResult> => ({ ok: true, provider: "msg91" }));
      const { otp } = createIdentityAccessModule(
        fakePorts({ msg91NativeOtp: { send, verify: vi.fn() } }),
      );

      await otp.sendNativeLoginOtp({ phoneNumber: "+919876543210" });

      expect(send).toHaveBeenCalledWith("+919876543210", { otpLength: 6, expirySeconds: 300 });
    });
  });
});
