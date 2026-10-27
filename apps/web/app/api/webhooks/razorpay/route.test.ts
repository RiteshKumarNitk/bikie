/**
 * Transport + routing coverage for the shared Razorpay Subscriptions webhook: signature/body
 * validation, idempotency, and — the core of this file — that an event is routed to
 * `MembershipService` (Rider, ₹149/year) vs `PartnerMembershipService` (Service Provider,
 * ₹99/month) correctly via `SubscriptionWebhookRouter.resolveAccountType`, never both, never
 * guessed. Each service's own `recordRecurringCharge`/`recordSubscriptionStatusChange` logic is
 * covered in their respective *.service.test.ts files.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { verifyWebhookSignature } = vi.hoisted(() => ({ verifyWebhookSignature: vi.fn(() => true) }));
const { claimWebhookEvent, partnerRecordRecurringCharge, partnerRecordSubscriptionStatusChange } = vi.hoisted(() => ({
  claimWebhookEvent: vi.fn(async () => true),
  partnerRecordRecurringCharge: vi.fn(),
  partnerRecordSubscriptionStatusChange: vi.fn(),
}));
const { riderRecordRecurringCharge, riderRecordSubscriptionStatusChange } = vi.hoisted(() => ({
  riderRecordRecurringCharge: vi.fn(),
  riderRecordSubscriptionStatusChange: vi.fn(),
}));
const { resolveAccountType } = vi.hoisted(() => ({ resolveAccountType: vi.fn() }));

vi.mock("@bikie/services", () => ({
  RazorpayService: { verifyWebhookSignature },
  PartnerMembershipService: {
    claimWebhookEvent,
    recordRecurringCharge: partnerRecordRecurringCharge,
    recordSubscriptionStatusChange: partnerRecordSubscriptionStatusChange,
  },
  MembershipService: {
    recordRecurringCharge: riderRecordRecurringCharge,
    recordSubscriptionStatusChange: riderRecordSubscriptionStatusChange,
  },
  SubscriptionWebhookRouter: { resolveAccountType },
}));

import { POST } from "./route";

afterEach(() => vi.resetAllMocks());

function webhookRequest(body: object, signature = "valid-sig") {
  return new Request("http://localhost/api/webhooks/razorpay", {
    method: "POST",
    headers: signature ? { "x-razorpay-signature": signature } : {},
    body: JSON.stringify(body),
  });
}

const subscriptionPayload = (overrides: Partial<{ id: string; status: string }> = {}) => ({
  id: "evt_1",
  event: "subscription.charged",
  payload: {
    subscription: { entity: { id: overrides.id ?? "sub_abc123", status: overrides.status ?? "active", current_start: 1700000000, current_end: 1702592000 } },
    payment: { entity: { id: "pay_1", amount: 9900 } },
  },
});

describe("POST /api/webhooks/razorpay — transport", () => {
  it("400s on an invalid/missing signature, never claims or processes the event", async () => {
    verifyWebhookSignature.mockReturnValueOnce(false);

    const res = await POST(webhookRequest(subscriptionPayload()));

    expect(res.status).toBe(400);
    expect(claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("400s when the request has no signature header at all", async () => {
    const res = await POST(webhookRequest(subscriptionPayload(), ""));
    expect(res.status).toBe(400);
  });

  it("400s on malformed JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/webhooks/razorpay", {
        method: "POST",
        headers: { "x-razorpay-signature": "valid-sig" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("400s when the (validly signed) payload has no event id", async () => {
    const res = await POST(webhookRequest({ event: "subscription.charged" }));
    expect(res.status).toBe(400);
    expect(claimWebhookEvent).not.toHaveBeenCalled();
  });

  it("200s as a duplicate without resolving the account type or processing, on a replayed event id", async () => {
    claimWebhookEvent.mockResolvedValueOnce(false);

    const res = await POST(webhookRequest(subscriptionPayload()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, duplicate: true });
    expect(resolveAccountType).not.toHaveBeenCalled();
  });

  it("200s with no processing when the payload has no subscription entity", async () => {
    const res = await POST(webhookRequest({ id: "evt_1", event: "subscription.charged", payload: {} }));
    expect(res.status).toBe(200);
    expect(resolveAccountType).not.toHaveBeenCalled();
  });

  it("200s (logged) without calling either service when the subscription id matches neither account type", async () => {
    resolveAccountType.mockResolvedValueOnce(null);

    const res = await POST(webhookRequest(subscriptionPayload()));

    expect(res.status).toBe(200);
    expect(partnerRecordRecurringCharge).not.toHaveBeenCalled();
    expect(riderRecordRecurringCharge).not.toHaveBeenCalled();
  });

  it("still 200s (never a 5xx back to Razorpay) when processing itself throws", async () => {
    resolveAccountType.mockResolvedValueOnce("SERVICE_PROVIDER");
    partnerRecordRecurringCharge.mockRejectedValueOnce(new Error("db down"));

    const res = await POST(webhookRequest(subscriptionPayload()));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/webhooks/razorpay — routes to the correct service by account type", () => {
  it("subscription.charged for a SERVICE_PROVIDER subscription calls PartnerMembershipService, never MembershipService", async () => {
    resolveAccountType.mockResolvedValueOnce("SERVICE_PROVIDER");

    await POST(webhookRequest(subscriptionPayload()));

    expect(partnerRecordRecurringCharge).toHaveBeenCalledWith(
      "sub_abc123",
      expect.objectContaining({ razorpayPaymentId: "pay_1", amount: 99 }),
    );
    expect(riderRecordRecurringCharge).not.toHaveBeenCalled();
  });

  it("subscription.charged for a RIDER subscription calls MembershipService, never PartnerMembershipService", async () => {
    resolveAccountType.mockResolvedValueOnce("RIDER");

    await POST(webhookRequest(subscriptionPayload({ id: "sub_rider1" })));

    expect(riderRecordRecurringCharge).toHaveBeenCalledWith(
      "sub_rider1",
      expect.objectContaining({ razorpayPaymentId: "pay_1", amount: 99 }),
    );
    expect(partnerRecordRecurringCharge).not.toHaveBeenCalled();
  });

  it("subscription.activated WITH a payment is treated like charged, routed to the resolved service", async () => {
    resolveAccountType.mockResolvedValueOnce("RIDER");
    const payload = subscriptionPayload({ id: "sub_rider1" });
    payload.event = "subscription.activated";

    await POST(webhookRequest(payload));

    expect(riderRecordRecurringCharge).toHaveBeenCalledWith("sub_rider1", expect.objectContaining({ razorpayPaymentId: "pay_1" }));
    expect(riderRecordSubscriptionStatusChange).not.toHaveBeenCalled();
  });

  it("subscription.activated WITHOUT a payment is status-only, routed to the resolved service", async () => {
    resolveAccountType.mockResolvedValueOnce("SERVICE_PROVIDER");
    const payload = {
      id: "evt_1",
      event: "subscription.activated",
      payload: { subscription: { entity: { id: "sub_abc123", status: "authenticated" } } },
    };

    await POST(webhookRequest(payload));

    expect(partnerRecordSubscriptionStatusChange).toHaveBeenCalledWith("sub_abc123", "authenticated");
    expect(partnerRecordRecurringCharge).not.toHaveBeenCalled();
  });

  it.each(["subscription.pending", "subscription.halted", "subscription.completed"])(
    "%s is status-only, routed to the resolved service, never stamps cancelledAt",
    async (eventType) => {
      resolveAccountType.mockResolvedValueOnce("RIDER");
      const payload = { id: "evt_1", event: eventType, payload: { subscription: { entity: { id: "sub_rider1", status: "halted" } } } };

      await POST(webhookRequest(payload));

      expect(riderRecordSubscriptionStatusChange).toHaveBeenCalledWith("sub_rider1", "halted", {});
    },
  );

  it("subscription.cancelled stamps cancelledAt, routed to the resolved service", async () => {
    resolveAccountType.mockResolvedValueOnce("SERVICE_PROVIDER");
    const payload = { id: "evt_1", event: "subscription.cancelled", payload: { subscription: { entity: { id: "sub_abc123", status: "cancelled" } } } };

    await POST(webhookRequest(payload));

    expect(partnerRecordSubscriptionStatusChange).toHaveBeenCalledWith("sub_abc123", "cancelled", { cancelledAt: expect.any(Date) });
  });
});
