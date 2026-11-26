import { RazorpayService } from "@bikie/services";

export type SubscriptionCheckoutMode = "native" | "hosted";

/**
 * Which checkout the app should use for a new AutoPay authorization.
 *
 * - `hosted` (default): Razorpay's hosted subscription page (`shortUrl`) — the existing,
 *   production-proven flow.
 * - `native`: Razorpay's in-app Checkout SDK with `subscription_id`, which can prefill the
 *   member's name, mobile number and email. Enabled only when the operator sets
 *   `RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE=native` — after it has been verified in Razorpay test
 *   mode — so it can be switched on (or back off) without an app release.
 *
 * Both modes authorize the SAME Razorpay subscription; switching never creates a new one.
 */
export function subscriptionCheckoutMode(): SubscriptionCheckoutMode {
  const configured = process.env.RAZORPAY_SUBSCRIPTION_CHECKOUT_MODE?.trim().toLowerCase();
  return configured === "native" && RazorpayService.publicKeyId() ? "native" : "hosted";
}

/**
 * The subscription fields returned to clients by `POST /api/{membership,partner-membership}/
 * subscription`. Additive to the existing `{ id, status, shortUrl }` shape (older app versions
 * ignore the new fields). Exposes only the PUBLIC key id — never the key secret.
 */
export function subscriptionCheckoutPayload(
  subscription: { id: string; status: string; shortUrl: string },
  reused: boolean,
) {
  return {
    ...subscription,
    reused,
    keyId: RazorpayService.publicKeyId(),
    checkoutMode: subscriptionCheckoutMode(),
  };
}
