import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTestServiceProviderAccount } from "./domain/test-otp-bypass";

// ADR-089 — the payment exemption must only ever apply to the allowlisted Service Provider test
// account, and only while the ADR-072 test bypass is deliberately configured.
describe("isTestServiceProviderAccount", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TEST_OTP", "123456");
    vi.stubEnv("TEST_SERVICE_PROVIDER_PHONE", "9000000002");
    vi.stubEnv("TEST_RIDER_PHONE", "9000000001");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches the configured Service Provider test number in any common format", () => {
    expect(isTestServiceProviderAccount("+919000000002")).toBe(true);
    expect(isTestServiceProviderAccount("919000000002")).toBe(true);
    expect(isTestServiceProviderAccount("9000000002")).toBe(true);
  });

  it("never matches the Rider test number or any other account", () => {
    expect(isTestServiceProviderAccount("+919000000001")).toBe(false);
    expect(isTestServiceProviderAccount("+919876543210")).toBe(false);
    expect(isTestServiceProviderAccount(null)).toBe(false);
    expect(isTestServiceProviderAccount(undefined)).toBe(false);
  });

  it("is off in production unless TEST_OTP is configured (ADR-072 enablement rule)", () => {
    vi.stubEnv("TEST_OTP", "");
    expect(isTestServiceProviderAccount("+919000000002")).toBe(false);
  });

  it("is off when no Service Provider test number is configured", () => {
    vi.stubEnv("TEST_SERVICE_PROVIDER_PHONE", "");
    expect(isTestServiceProviderAccount("+919000000002")).toBe(false);
  });
});
