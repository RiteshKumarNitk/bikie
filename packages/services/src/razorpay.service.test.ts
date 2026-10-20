import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const subscriptionsCreate = vi.fn();
const subscriptionsCancel = vi.fn();
const ordersCreate = vi.fn();

// `razorpay.service.ts`'s `getClient()` memoizes one instance — mock the SDK's class itself so
// every `new Razorpay(...)` call in this file returns the same spies, regardless of credentials.
vi.mock("razorpay", () => {
  class MockRazorpay {
    subscriptions = { create: subscriptionsCreate, cancel: subscriptionsCancel };
    orders = { create: ordersCreate };
    static validateWebhookSignature(body: string, signature: string, secret: string): boolean {
      // Real HMAC-SHA256, matching Razorpay's own documented algorithm exactly — not mocked, so
      // these tests prove the actual crypto, not a stub's say-so.
      const expected = createHmac("sha256", secret).update(body).digest("hex");
      return expected === signature;
    }
  }
  return { default: MockRazorpay };
});

import { RazorpayService } from "./razorpay.service";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("RazorpayService.verifyWebhookSignature", () => {
  it("accepts a correctly signed body", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "whsec_test123");
    const body = JSON.stringify({ event: "subscription.charged" });
    const signature = createHmac("sha256", "whsec_test123").update(body).digest("hex");

    expect(RazorpayService.verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("rejects a tampered/incorrect signature", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "whsec_test123");
    const body = JSON.stringify({ event: "subscription.charged" });

    expect(RazorpayService.verifyWebhookSignature(body, "0".repeat(64))).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "whsec_test123");
    const body = JSON.stringify({ event: "subscription.charged" });
    const wrongSignature = createHmac("sha256", "some-other-secret").update(body).digest("hex");

    expect(RazorpayService.verifyWebhookSignature(body, wrongSignature)).toBe(false);
  });

  it("rejects when RAZORPAY_WEBHOOK_SECRET is unset — never falls back to RAZORPAY_KEY_SECRET", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    const body = JSON.stringify({ event: "subscription.charged" });
    const signature = createHmac("sha256", "whsec_test123").update(body).digest("hex");

    expect(RazorpayService.verifyWebhookSignature(body, signature)).toBe(false);
  });

  it("rejects an empty signature", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "whsec_test123");
    expect(RazorpayService.verifyWebhookSignature("{}", "")).toBe(false);
  });
});

describe("RazorpayService.isWebhookConfigured", () => {
  it("true when RAZORPAY_WEBHOOK_SECRET is set", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "whsec_test123");
    expect(RazorpayService.isWebhookConfigured()).toBe(true);
  });

  it("false when unset — distinct from isConfigured() (the order/payment key pair)", () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    expect(RazorpayService.isWebhookConfigured()).toBe(false);
    expect(RazorpayService.isConfigured()).toBe(true);
  });
});

describe("RazorpayService.createSubscription / cancelSubscription", () => {
  it("createSubscription returns null (no network call) when RAZORPAY_KEY_ID/SECRET are unset", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");

    const result = await RazorpayService.createSubscription("plan_xyz");

    expect(result).toBeNull();
    expect(subscriptionsCreate).not.toHaveBeenCalled();
  });

  it("createSubscription calls the SDK with the given plan id and the configured total_count, never a hardcoded plan", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsCreate.mockResolvedValueOnce({
      id: "sub_abc",
      status: "created",
      short_url: "https://rzp.io/i/abc",
      current_start: null,
      current_end: null,
    });

    const result = await RazorpayService.createSubscription("plan_xyz", { userId: "u1" });

    expect(subscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ plan_id: "plan_xyz", total_count: RazorpayService.SUBSCRIPTION_TOTAL_COUNT, notes: { userId: "u1" } }),
    );
    expect(result).toEqual({ id: "sub_abc", status: "created", shortUrl: "https://rzp.io/i/abc", currentStart: null, currentEnd: null });
  });

  it("createSubscription returns null (logged) when the SDK call throws", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsCreate.mockRejectedValueOnce(new Error("network down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await RazorpayService.createSubscription("plan_xyz");

    expect(result).toBeNull();
    err.mockRestore();
  });

  it("cancelSubscription forwards cancelAtCycleEnd and returns the updated status", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsCancel.mockResolvedValueOnce({
      id: "sub_abc",
      status: "active",
      short_url: "",
      current_start: 1760000000,
      current_end: 1762600000,
    });

    const result = await RazorpayService.cancelSubscription("sub_abc", true);

    expect(subscriptionsCancel).toHaveBeenCalledWith("sub_abc", true);
    expect(result).toMatchObject({ id: "sub_abc", status: "active" });
  });

  it("cancelSubscription returns null when unconfigured", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");

    const result = await RazorpayService.cancelSubscription("sub_abc", true);

    expect(result).toBeNull();
    expect(subscriptionsCancel).not.toHaveBeenCalled();
  });
});
