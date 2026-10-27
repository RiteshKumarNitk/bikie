import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { startMembershipSubscriptionSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

const ERROR_STATUS: Record<string, number> = {
  PLAN_NOT_FOUND: 404,
  ALREADY_ACTIVE: 409,
  SUBSCRIPTION_ALREADY_EXISTS: 409,
  NOT_CONFIGURED: 503,
  SUBSCRIPTION_CREATE_FAILED: 503,
};

// A stale/never-authorized attempt no longer reaches SUBSCRIPTION_ALREADY_EXISTS at all (the
// service transparently cancels and replaces it) — this message is now shown only for a REAL
// subscription that already took at least one successful payment, so "cancel it first" is always
// accurate here, never shown after a merely-failed/abandoned authorization. Mirrors
// `/api/partner-membership/subscription`'s identical error map exactly.
const ERROR_MESSAGE: Record<string, string> = {
  PLAN_NOT_FOUND: "This plan is no longer available.",
  ALREADY_ACTIVE: "You already have an active membership.",
  SUBSCRIPTION_ALREADY_EXISTS: "You already have an active subscription. Cancel it first if you want to start a new one.",
  NOT_CONFIGURED: "Subscriptions are temporarily unavailable. Please try again later.",
  SUBSCRIPTION_CREATE_FAILED: "Could not start the subscription. Please try again.",
};

/**
 * `POST /api/membership/subscription` — starts a ₹149/year recurring Razorpay Subscription for
 * the Rider. Mirrors `/api/partner-membership/subscription` exactly (Service Provider ₹99/month)
 * — separate plan id/table, identical shape. Does NOT activate the membership — only a later,
 * verified webhook event does (see `/api/webhooks/razorpay`). The existing one-time `/checkout`+
 * `/purchase` flow is untouched and remains available alongside this.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = startMembershipSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await MembershipService.startSubscription(session.user.id, parsed.data.planId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, message: ERROR_MESSAGE[result.reason] },
      { status: ERROR_STATUS[result.reason] ?? 400 },
    );
  }
  return NextResponse.json({ membership: result.membership, subscription: result.subscription });
}
