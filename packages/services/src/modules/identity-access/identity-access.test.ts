import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  membershipRepository: { getActiveMembership: vi.fn(async () => null) },
}));

import { isAccountRestricted } from "./domain/account-status";
import { buildOtpMessage } from "./domain/otp-message";
import { hasPermission, permissionsForRole } from "./domain/permissions";
import { hasRole, isAdmin } from "./domain/roles";
import { createIdentityAccessModule } from "./public";
import type { ChannelResult } from "../communications/ports";
import type { IdentityAccessPorts, SessionSnapshot } from "./ports";

function fakePorts(overrides: Partial<IdentityAccessPorts> = {}): IdentityAccessPorts {
  return {
    membership: { hasActiveMembership: vi.fn(async () => false) },
    otpEcho: { remember: vi.fn(async () => undefined) },
    sms: { send: vi.fn(async (): Promise<ChannelResult> => ({ ok: true, provider: "twilio" })) },
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

describe("otp application", () => {
  it("keeps the existing SMS copy", () => {
    expect(buildOtpMessage("123456", 300)).toBe(
      "Your BIKIE verification code is 123456. It expires in 5 minutes.",
    );
  });

  it("writes the dev echo before sending and returns the channel result", async () => {
    const calls: string[] = [];
    const remember = vi.fn(async () => {
      calls.push("echo");
    });
    const send = vi.fn(async (): Promise<ChannelResult> => {
      calls.push("sms");
      return { ok: false, provider: "dev", error: "Twilio credentials not configured" };
    });

    const { otp } = createIdentityAccessModule(
      fakePorts({ otpEcho: { remember }, sms: { send } }),
    );

    const result = await otp.sendLoginOtp({
      phoneNumber: "+919876543210",
      code: "123456",
      expiresInSeconds: 300,
    });

    expect(calls).toEqual(["echo", "sms"]);
    expect(remember).toHaveBeenCalledWith("+919876543210", "123456", 300);
    expect(send).toHaveBeenCalledWith(
      "+919876543210",
      "Your BIKIE verification code is 123456. It expires in 5 minutes.",
    );
    expect(result).toEqual({ ok: false, provider: "dev", error: "Twilio credentials not configured" });
  });
});
