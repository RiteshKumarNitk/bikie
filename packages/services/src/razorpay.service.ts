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
   * the same rupee amounts the rest of this codebase already uses (`MembershipPlan.price`). */
  async createOrder(amountRupees: number, receipt: string): Promise<RazorpayOrder | null> {
    const creds = credentials();
    if (!creds) return null;

    const order = await getClient(creds.keyId, creds.keySecret).orders.create({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt,
    });
    return { orderId: order.id, amount: Number(order.amount), currency: order.currency, keyId: creds.keyId };
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
};
