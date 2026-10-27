import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { purchaseMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/membership/purchase` (ADR-043, narrowed by the yearly-auto-debit-only change,
 * mirroring ADR-094's Service Provider narrowing) — a free plan (server-side price 0, never a
 * client-asserted claim) activates immediately with no payment step. The Rider test account still
 * activates a paid plan without a verified payment. Every other paid-plan request is rejected: a
 * real Rider only ever activates through a Razorpay Subscription's webhook
 * (`MembershipService.recordRecurringCharge`), never this route.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = purchaseMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { planId, paymentId, razorpayOrderId, razorpayPaymentId } = parsed.data;

  const plan = await MembershipService.getPlanById(planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.price === 0) {
    const result = await MembershipService.purchaseMembership(session.user.id, planId);
    if (!result.ok) {
      return NextResponse.json(
        { error: "ALREADY_ACTIVE_MEMBERSHIP", message: "You already have an active membership." },
        { status: 409 },
      );
    }
    return NextResponse.json({ membership: result.membership });
  }

  // Store-review/QA Rider test account: activates without a verified payment, in production too
  // (only while the ADR-072 test bypass is configured). Any payment reference the client sent is
  // recorded; otherwise a DUMMY- one, which billing already treats as "not a real Razorpay
  // payment". Already active = success, not an error, for this account.
  if (MembershipService.isPaymentExemptTestAccount(session.user.phoneNumber)) {
    const reference = razorpayPaymentId ?? paymentId ?? `DUMMY-TEST-ACCOUNT-${crypto.randomUUID()}`;
    const result = await MembershipService.purchaseMembership(session.user.id, planId, reference, razorpayOrderId);
    console.log(`[MEMBERSHIP][TEST_ACCOUNT] rider membership user=${session.user.id} ok=${result.ok}`);
    if (!result.ok) {
      const active = await MembershipService.getActiveMembership(session.user.id);
      return NextResponse.json({ membership: active, alreadyActive: true });
    }
    return NextResponse.json({ membership: result.membership });
  }

  // Rider membership is yearly-auto-debit-only — a real Rider never completes a one-time purchase
  // for a paid plan; `POST /api/membership/subscription` (a real Razorpay Subscription + mandate)
  // plus its `subscription.charged` webhook is the only way a paid Rider membership activates.
  // Checked server-side (not just hidden in the UI) so an old mobile build, a stale Razorpay
  // order, or a direct API call can't buy a one-time membership that never auto-renews.
  return NextResponse.json(
    {
      error: "ONE_TIME_PURCHASE_DISABLED",
      message: "Membership is yearly auto-renewing only. Use the subscription endpoint to start it.",
    },
    { status: 403 },
  );
}