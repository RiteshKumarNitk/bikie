import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { confirmSubscriptionCheckoutSchema } from "@bikie/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireSession } from "@/lib/require-role";

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  INVALID_SIGNATURE: 400,
  COULD_NOT_VERIFY: 503,
};

const ERROR_MESSAGE: Record<string, string> = {
  NOT_FOUND: "We couldn't find this membership payment.",
  INVALID_SIGNATURE: "We couldn't verify this payment. Your membership will update once Razorpay confirms it.",
  COULD_NOT_VERIFY: "We couldn't confirm your payment with Razorpay yet. Your membership will update automatically.",
};

/**
 * `POST /api/partner-membership/subscription/verify` — Service Provider equivalent of
 * `/api/membership/subscription/verify`: server-side signature verification, then confirmation
 * straight from Razorpay (`PartnerMembershipService.confirmCheckoutPayment`). Never activates from
 * the client's callback alone; the webhook remains the authoritative fallback.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  // Each call reaches Razorpay's API — bounded per user (an honest client calls this once per
  // checkout; a few retries are plenty).
  const rateLimitError = await enforceRateLimit("partner-membership-checkout-verify", session.user.id, { requests: 10, windowSeconds: 600 });
  if (rateLimitError) return rateLimitError;

  const parsed = confirmSubscriptionCheckoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await PartnerMembershipService.confirmCheckoutPayment(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, message: ERROR_MESSAGE[result.reason] },
      { status: ERROR_STATUS[result.reason] ?? 400 },
    );
  }
  return NextResponse.json({ membership: result.membership, active: result.active });
}
