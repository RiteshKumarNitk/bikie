import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

let client: Razorpay | null = null;
function getClient(keyId: string, keySecret: string): Razorpay {
  client ??= new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RazorpaySubscription {
  id: string;
  status: string;
  shortUrl: string;
  /** Unix seconds (Razorpay's own unit) — converted to `Date` by the caller when persisting. */
  currentStart: number | null;
  currentEnd: number | null;
}

/**
 * Real order creation + payment-signature verification (ADR-043) — DEV fallback (no live
 * order, `purchase` accepts a client-supplied `paymentId` directly) preserves the pre-existing
 * simulated-checkout demo experience exactly as it worked before, for as long as
 * `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` stay unset. The moment both are set, DEV mode turns
 * off automatically — `isConfigured()` is what the purchase route checks to decide whether a
 * bare client-supplied `paymentId` is still acceptable or a verified signature is required.
 */
export const RazorpayService = {
  isConfigured(): boolean {
    return credentials() !== null;
  },

  /**
   * ADR-069 — may the simulated / dummy-`paymentId` checkout still grant a membership when
   * Razorpay is unconfigured? Only outside production. In production, missing keys means
   * payments are genuinely unavailable, NOT "free" — the purchase/checkout routes return 503
   * instead of accepting a client-supplied dummy payment.
   */
  isDevFallbackAllowed(): boolean {
    return process.env.NODE_ENV !== "production";
  },

  /** `amountRupees` — converted to paise (Razorpay's base unit) here so every caller works in
   * the same rupee amounts the rest of this codebase already uses (`MembershipPlan.price`).
   * `receipt` — Razorpay caps this at **40 characters** and rejects the whole order otherwise, so
   * it's truncated defensively here (callers already keep it short; the full ids live in `notes`).
   * `notes` — Razorpay's per-order key/value bag (max 15 pairs); we stamp the buyer + plan on
   * it so a payment can be reconciled from the Razorpay dashboard or a future `order.paid`
   * webhook without re-deriving anything from the client callback.
   *
   * Returns `null` on any Razorpay-side failure (auth, validation, network) rather than throwing —
   * the checkout routes turn `null` into a clean `503 CHECKOUT_UNAVAILABLE` instead of a 500, and
   * the real error is logged for the operator. */
  async createOrder(
    amountRupees: number,
    receipt: string,
    notes?: Record<string, string>,
  ): Promise<RazorpayOrder | null> {
    const creds = credentials();
    if (!creds) return null;

    try {
      const order = await getClient(creds.keyId, creds.keySecret).orders.create({
        amount: Math.round(amountRupees * 100),
        currency: "INR",
        receipt: receipt.slice(0, 40),
        ...(notes ? { notes } : {}),
      });
      return { orderId: order.id, amount: Number(order.amount), currency: order.currency, keyId: creds.keyId };
    } catch (err) {
      console.error("[Razorpay][createOrder] order creation failed:", err);
      return null;
    }
  },

  /**
   * HMAC-SHA256(`${orderId}|${paymentId}`, keySecret) === signature — Razorpay's documented
   * checkout-callback verification. Returns `false` (never throws) if Razorpay isn't
   * configured at all, so a caller can't accidentally treat "not configured" as "verified," and
   * on any malformed/wrong-length signature input, rather than letting `timingSafeEqual` throw.
   * `timingSafeEqual`, not `===` — a payment signature is exactly the kind of secret comparison
   * a short-circuiting string compare can leak through response-time differences.
   */
  verifyPaymentSignature(params: { orderId: string; paymentId: string; signature: string }): boolean {
    const creds = credentials();
    if (!creds) return false;

    const expected = createHmac("sha256", creds.keySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest("hex");
    const expectedBuf = Buffer.from(expected, "hex");
    const actualBuf = Buffer.from(params.signature, "hex");
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(
      expectedBuf as unknown as Uint8Array,
      actualBuf as unknown as Uint8Array,
    );
  },

  /** A Subscription has no natural end, but Razorpay's API requires a finite `total_count` of
   * billing cycles — 1200 months (100 years) is the conventional "effectively indefinite" value
   * for an open-ended monthly membership; cancellation is a separate explicit action
   * (`cancelSubscription`), never reaching this count in practice. */
  SUBSCRIPTION_TOTAL_COUNT: 1200,

  /**
   * Creates a Razorpay Subscription against the given Plan id (a Razorpay Plan — a different
   * object from BIKIE's own `PartnerMembershipPlan` row, configured in env, never hardcoded).
   * Returns `null` on any Razorpay-side failure, same convention as `createOrder` — the caller
   * turns that into a clean 503 rather than a 500.
   */
  async createSubscription(
    planId: string,
    notes?: Record<string, string>,
  ): Promise<RazorpaySubscription | null> {
    const creds = credentials();
    if (!creds) return null;

    try {
      const sub = await getClient(creds.keyId, creds.keySecret).subscriptions.create({
        plan_id: planId,
        total_count: RazorpayService.SUBSCRIPTION_TOTAL_COUNT,
        customer_notify: true,
        ...(notes ? { notes } : {}),
      });
      return {
        id: sub.id,
        status: sub.status,
        shortUrl: sub.short_url,
        currentStart: sub.current_start ?? null,
        currentEnd: sub.current_end ?? null,
      };
    } catch (err) {
      console.error("[Razorpay][createSubscription] subscription creation failed:", err);
      return null;
    }
  },

  /**
   * Razorpay's own live, authoritative view of a Subscription — used (not the locally-stored
   * `subscriptionStatus`/`endDate`, which can lag behind by exactly as long as a webhook takes
   * to arrive) to decide whether a stale/abandoned subscription is genuinely safe to cancel and
   * replace. `paidCount` (Razorpay's `paid_count`) is the number of billing cycles actually
   * charged — `0` means no money has ever moved on this subscription, regardless of what its
   * `status` says, which is the one fact that must never be guessed from local state alone.
   * Returns `null` on any failure (logged) — callers must fail toward NOT touching the
   * subscription when this can't be verified, never toward assuming it's safe.
   */
  async fetchSubscription(razorpaySubscriptionId: string): Promise<{ status: string; paidCount: number } | null> {
    const creds = credentials();
    if (!creds) return null;

    try {
      const sub = await getClient(creds.keyId, creds.keySecret).subscriptions.fetch(razorpaySubscriptionId);
      return { status: sub.status, paidCount: sub.paid_count };
    } catch (err) {
      console.error("[Razorpay][fetchSubscription] fetch failed:", err);
      return null;
    }
  },

  /** `cancelAtCycleEnd: true` lets the provider keep the already-paid-for current period instead
   * of losing access immediately — the caller decides based on `currentPeriodEnd`/`endDate`,
   * this just forwards to Razorpay. Returns `null` on failure (logged), never throws. */
  async cancelSubscription(
    razorpaySubscriptionId: string,
    cancelAtCycleEnd: boolean,
  ): Promise<RazorpaySubscription | null> {
    const creds = credentials();
    if (!creds) return null;

    try {
      const sub = await getClient(creds.keyId, creds.keySecret).subscriptions.cancel(
        razorpaySubscriptionId,
        cancelAtCycleEnd,
      );
      return {
        id: sub.id,
        status: sub.status,
        shortUrl: sub.short_url,
        currentStart: sub.current_start ?? null,
        currentEnd: sub.current_end ?? null,
      };
    } catch (err) {
      console.error("[Razorpay][cancelSubscription] subscription cancellation failed:", err);
      return null;
    }
  },

  /** Whether `RAZORPAY_WEBHOOK_SECRET` is set — distinct from `isConfigured()` (the
   * order/payment key pair): a deployment can have one without the other mid-rollout. */
  isWebhookConfigured(): boolean {
    return !!process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  },

  /**
   * Razorpay webhook signature verification (ADR-093-style additive change) — HMAC-SHA256 of the
   * exact raw request body, keyed by `RAZORPAY_WEBHOOK_SECRET`. Deliberately a DIFFERENT secret
   * from `RAZORPAY_KEY_SECRET` (`verifyPaymentSignature` above): webhooks and the checkout
   * callback are signed with different keys by Razorpay's own design. Uses the SDK's own
   * `Razorpay.validateWebhookSignature` (already timing-safe) rather than hand-rolling HMAC
   * comparison a second time. `rawBody` MUST be the literal, unparsed request body text — the
   * signature is computed over the exact bytes Razorpay sent, not a re-serialized JSON object.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    if (!secret || !signature) return false;
    try {
      return Razorpay.validateWebhookSignature(rawBody, signature, secret);
    } catch (err) {
      console.error("[Razorpay][verifyWebhookSignature] validation threw:", err);
      return false;
    }
  },
};
