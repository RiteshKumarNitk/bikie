import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { startPartnerSubscriptionSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

const ERROR_STATUS: Record<string, number> = {
  PLAN_NOT_FOUND: 404,
  ALREADY_ACTIVE: 409,
  SUBSCRIPTION_ALREADY_EXISTS: 409,
  NOT_CONFIGURED: 503,
  SUBSCRIPTION_CREATE_FAILED: 503,
};

/**
 * `POST /api/partner-membership/subscription` — starts a ₹99/month recurring Razorpay
 * Subscription. Mirrors `/api/partner-membership/checkout`+`/purchase`'s auth/validation shape,
 * but is otherwise a separate path: this does NOT activate the membership — only a later,
 * verified webhook event does (see `/api/webhooks/razorpay`).
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = startPartnerSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await PartnerMembershipService.startSubscription(session.user.id, parsed.data.planId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: ERROR_STATUS[result.reason] ?? 400 });
  }
  return NextResponse.json({ membership: result.membership, subscription: result.subscription });
}
