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

/** A Subscription has no natural end, but Razorpay's API requires a finite `total_count` of
 * billing cycles — 1200 months (100 years) is the conventional "effectively indefinite" value
 * for an open-ended MONTHLY membership (Service Provider, ₹99/month); cancellation is a separate
 * explicit action (`cancelSubscription`), never reaching this count in practice. Razorpay caps
 * `total_count` per billing *period and interval* combination, not as one global number — a
 * yearly Plan's cap is 100 (100 years), not 1200 (which would mean 1200 YEARS and is rejected
 * outright: `BAD_REQUEST_ERROR "Exceeds the maximum total_count (100) allowed for the given
 * period and interval"`). Callers on a non-monthly billing cycle must pass their own `totalCount`
 * to `createSubscription` rather than relying on this default. Defined at module scope (not as a
 * property on `RazorpayService` itself) so `createSubscription`'s default parameter can reference
 * it without a `RazorpayService` self-reference in its own initializer (TS7022). */
const SUBSCRIPTION_TOTAL_COUNT = 1200;

/** Mirrors `SUBSCRIPTION_TOTAL_COUNT`'s "effectively indefinite" intent for a YEARLY Plan
 * (Rider, ₹149/year). Razorpay's API-level cap for the yearly period/interval is 100, but
 * Razorpay Support confirmed UPI AutoPay specifically supports a maximum mandate duration of
 * 25 years regardless of that API cap — 100 was silently exceeding UPI's real limit (card-based
 * authorization isn't subject to it, which is why card mandates on this same Plan succeeded while
 * every UPI one failed). 20 keeps a margin under the confirmed 25-year ceiling. */
const SUBSCRIPTION_TOTAL_COUNT_YEARLY = 20;

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

  /** See the module-level `SUBSCRIPTION_TOTAL_COUNT` doc comment. */
  SUBSCRIPTION_TOTAL_COUNT,

  /** See the module-level `SUBSCRIPTION_TOTAL_COUNT_YEARLY` doc comment. */
  SUBSCRIPTION_TOTAL_COUNT_YEARLY,

  /**
   * Creates a Razorpay Subscription against the given Plan id (a Razorpay Plan — a different
   * object from BIKIE's own `PartnerMembershipPlan` row, configured in env, never hardcoded).
   * `totalCount` defaults to `SUBSCRIPTION_TOTAL_COUNT` (correct for a monthly Plan only) —
   * callers on any other billing cycle (e.g. `SUBSCRIPTION_TOTAL_COUNT_YEARLY` for a yearly Plan)
   * must pass the matching value explicitly; Razorpay rejects a `total_count` that exceeds its
   * own cap for the Plan's actual period/interval. Returns `null` on any Razorpay-side failure,
   * same convention as `createOrder` — the caller turns that into a clean 503 rather than a 500.
   */
  async createSubscription(
    planId: string,
    notes?: Record<string, string>,
    totalCount: number = SUBSCRIPTION_TOTAL_COUNT,
  ): Promise<RazorpaySubscription | null> {
    const creds = credentials();
    if (!creds) return null;

    try {
      const sub = await getClient(creds.keyId, creds.keySecret).subscriptions.create({
        plan_id: planId,
        total_count: totalCount,
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

  /**
   * Every PAID invoice Razorpay has recorded against a Subscription — the reconciliation path
   * for when its own webhook never reached us (never delivered, delivered while the app was
   * down, rejected by a transient signature/env mismatch, …): webhooks are a best-effort retry
   * mechanism on Razorpay's side, not a guarantee, so this exists to replay history straight from
   * Razorpay's own records rather than ever leave a real, successfully-charged subscription
   * stranded with no corresponding BIKIE membership. Returns oldest-first (billing order matters:
   * each charge's membership extension logically follows the previous one) and only `status ===
   * "paid"` invoices — a `draft`/`issued`/`cancelled` one was never actually charged. Returns `[]`
   * (not `null`) on failure — the caller's loop over an empty array is a safe no-op, and the
   * error is still logged for an operator to see.
   */
  async listSubscriptionInvoices(razorpaySubscriptionId: string): Promise<
    Array<{ razorpayPaymentId: string; amount: number; billingStart: Date | null; billingEnd: Date | null; paidAt: Date }>
  > {
    const creds = credentials();
    if (!creds) return [];

    try {
      const result = await getClient(creds.keyId, creds.keySecret).invoices.all({
        subscription_id: razorpaySubscriptionId,
        count: 100,
      });
      return result.items
        .filter((inv) => inv.status === "paid" && inv.payment_id)
        .map((inv) => ({
          razorpayPaymentId: inv.payment_id!,
          amount: (inv.amount_paid ?? 0) / 100,
          billingStart: typeof inv.billing_start === "number" ? new Date(inv.billing_start * 1000) : null,
          billingEnd: typeof inv.billing_end === "number" ? new Date(inv.billing_end * 1000) : null,
          paidAt: typeof inv.paid_at === "number" ? new Date(inv.paid_at * 1000) : new Date(inv.created_at * 1000),
        }))
        .sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());
    } catch (err) {
      console.error("[Razorpay][listSubscriptionInvoices] fetch failed:", err);
      return [];
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
