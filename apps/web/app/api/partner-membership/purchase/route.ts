import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { purchasePartnerMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/partner-membership/purchase` (ADR-051, narrowed by the monthly-auto-debit-only
 * change) — a free plan (server-side price 0, never a client-asserted claim) activates
 * immediately with no payment step. The ADR-089 test account still activates a paid plan without
 * a verified payment. Every other paid-plan request is rejected: a real SP only ever activates
 * through a Razorpay Subscription's webhook (`PartnerMembershipService.recordRecurringCharge`),
 * never this route. `/api/membership/purchase` (Rider) is a separate route, untouched.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = purchasePartnerMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { planId, paymentId, razorpayOrderId, razorpayPaymentId } = parsed.data;

  const plan = await PartnerMembershipService.getPlanById(planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.price === 0) {
    const result = await PartnerMembershipService.purchaseMembership(session.user.id, planId);
    if (!result.ok) {
      return NextResponse.json(
        { error: "ALREADY_ACTIVE_MEMBERSHIP", message: "You already have an active membership." },
        { status: 409 },
      );
    }
    return NextResponse.json({ membership: result.membership });
  }

  // ADR-089 — store-review/QA Service Provider test account: activates without a verified
  // payment, in production too (only while the ADR-072 test bypass is configured). Any payment
  // reference the client sent is recorded; otherwise a DUMMY- one, which billing already treats as
  // "not a real Razorpay payment". Already active = success, not an error, for this account.
  if (PartnerMembershipService.isPaymentExemptTestAccount(session.user.phoneNumber)) {
    const reference = razorpayPaymentId ?? paymentId ?? `DUMMY-TEST-ACCOUNT-${crypto.randomUUID()}`;
    const result = await PartnerMembershipService.purchaseMembership(session.user.id, planId, reference, razorpayOrderId);
    console.log(`[MEMBERSHIP][TEST_ACCOUNT] partner membership user=${session.user.id} ok=${result.ok}`);
    if (!result.ok) {
      const active = await PartnerMembershipService.getActiveMembership(session.user.id);
      return NextResponse.json({ membership: active, alreadyActive: true });
    }
    return NextResponse.json({ membership: result.membership });
  }

  // Service Provider membership is monthly-auto-debit-only — a real SP never completes a
  // one-time purchase for a paid plan; `POST /api/partner-membership/subscription` (a real
  // Razorpay Subscription + mandate) plus its `subscription.charged` webhook is the only way a
  // paid SP membership activates. Checked server-side (not just hidden in the UI) so an old
  // mobile build, a stale Razorpay order, or a direct API call can't buy a one-time membership
  // that never auto-renews. Riders are untouched — `/api/membership/purchase` is a separate route.
  return NextResponse.json(
    {
      error: "ONE_TIME_PURCHASE_DISABLED",
      message: "Service Provider membership is monthly auto-renewing only. Use the subscription endpoint to start it.",
    },
    { status: 403 },
  );
}
