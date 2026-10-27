import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const subscriptionsCreate = vi.fn();
const subscriptionsCancel = vi.fn();
const subscriptionsFetch = vi.fn();
const invoicesAll = vi.fn();
const ordersCreate = vi.fn();

// `razorpay.service.ts`'s `getClient()` memoizes one instance — mock the SDK's class itself so
// every `new Razorpay(...)` call in this file returns the same spies, regardless of credentials.
vi.mock("razorpay", () => {
  class MockRazorpay {
    subscriptions = { create: subscriptionsCreate, cancel: subscriptionsCancel, fetch: subscriptionsFetch };
    invoices = { all: invoicesAll };
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

  it("createSubscription honors a caller-supplied totalCount instead of the monthly default — regression guard for the yearly-Plan total_count bug", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsCreate.mockResolvedValueOnce({
      id: "sub_yearly",
      status: "created",
      short_url: "https://rzp.io/i/yearly",
      current_start: null,
      current_end: null,
    });

    await RazorpayService.createSubscription("plan_yearly", { accountType: "RIDER" }, RazorpayService.SUBSCRIPTION_TOTAL_COUNT_YEARLY);

    // Razorpay's own documented failure for this exact bug: "Exceeds the maximum total_count
    // (100) allowed for the given period and interval" when 1200 (the monthly default) is sent
    // for a yearly Plan — this locks in that a yearly caller gets 100, never 1200.
    expect(subscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ plan_id: "plan_yearly", total_count: 100 }),
    );
    expect(RazorpayService.SUBSCRIPTION_TOTAL_COUNT_YEARLY).toBe(100);
    expect(RazorpayService.SUBSCRIPTION_TOTAL_COUNT_YEARLY).not.toBe(RazorpayService.SUBSCRIPTION_TOTAL_COUNT);
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

describe("RazorpayService.fetchSubscription", () => {
  it("returns Razorpay's live status and paid_count (renamed paidCount) for a given subscription", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsFetch.mockResolvedValueOnce({ id: "sub_abc", status: "active", paid_count: 3 });

    const result = await RazorpayService.fetchSubscription("sub_abc");

    expect(subscriptionsFetch).toHaveBeenCalledWith("sub_abc");
    expect(result).toEqual({ status: "active", paidCount: 3 });
  });

  it("returns a never-charged subscription's paidCount as 0, not undefined/falsy-confused with 'unverifiable'", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsFetch.mockResolvedValueOnce({ id: "sub_abc", status: "created", paid_count: 0 });

    const result = await RazorpayService.fetchSubscription("sub_abc");

    expect(result).toEqual({ status: "created", paidCount: 0 });
  });

  it("returns null (no network call) when RAZORPAY_KEY_ID/SECRET are unset", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");

    const result = await RazorpayService.fetchSubscription("sub_abc");

    expect(result).toBeNull();
    expect(subscriptionsFetch).not.toHaveBeenCalled();
  });

  it("returns null (logged) when the SDK call throws — callers must treat this as 'could not verify', never as 'safe'", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    subscriptionsFetch.mockRejectedValueOnce(new Error("network down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await RazorpayService.fetchSubscription("sub_abc");

    expect(result).toBeNull();
    err.mockRestore();
  });
});

describe("RazorpayService.listSubscriptionInvoices", () => {
  it("returns only PAID invoices, oldest first, converted to rupees and real Dates", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    invoicesAll.mockResolvedValueOnce({
      entity: "collection",
      count: 3,
      items: [
        // Out of order on purpose — the newest one first, as Razorpay's `all()` typically returns.
        {
          id: "inv_3", status: "paid", payment_id: "pay_3", amount_paid: 9900,
          billing_start: 1764000000, billing_end: 1766678400, paid_at: 1764000500, created_at: 1764000000,
        },
        { id: "inv_2", status: "issued", payment_id: null, amount_paid: 0, created_at: 1761408000 }, // never paid — excluded
        {
          id: "inv_1", status: "paid", payment_id: "pay_1", amount_paid: 9900,
          billing_start: 1761321600, billing_end: 1764000000, paid_at: 1761322000, created_at: 1761321600,
        },
      ],
    });

    const result = await RazorpayService.listSubscriptionInvoices("sub_abc");

    expect(invoicesAll).toHaveBeenCalledWith({ subscription_id: "sub_abc", count: 100 });
    expect(result).toEqual([
      {
        razorpayPaymentId: "pay_1",
        amount: 99,
        billingStart: new Date(1761321600 * 1000),
        billingEnd: new Date(1764000000 * 1000),
        paidAt: new Date(1761322000 * 1000),
      },
      {
        razorpayPaymentId: "pay_3",
        amount: 99,
        billingStart: new Date(1764000000 * 1000),
        billingEnd: new Date(1766678400 * 1000),
        paidAt: new Date(1764000500 * 1000),
      },
    ]);
  });

  it("falls back to created_at when an invoice has no paid_at", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    invoicesAll.mockResolvedValueOnce({
      entity: "collection",
      count: 1,
      items: [{ id: "inv_1", status: "paid", payment_id: "pay_1", amount_paid: 9900, created_at: 1761321600 }],
    });

    const result = await RazorpayService.listSubscriptionInvoices("sub_abc");

    expect(result[0].paidAt).toEqual(new Date(1761321600 * 1000));
    expect(result[0].billingStart).toBeNull();
  });

  it("returns [] (no network call) when RAZORPAY_KEY_ID/SECRET are unset", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "");

    const result = await RazorpayService.listSubscriptionInvoices("sub_abc");

    expect(result).toEqual([]);
    expect(invoicesAll).not.toHaveBeenCalled();
  });

  it("returns [] (logged) when the SDK call throws — never throws itself", async () => {
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_x");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "secret_x");
    invoicesAll.mockRejectedValueOnce(new Error("network down"));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await RazorpayService.listSubscriptionInvoices("sub_abc");

    expect(result).toEqual([]);
    err.mockRestore();
  });
});
