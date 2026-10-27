import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { checkoutMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/membership/checkout` (ADR-043, narrowed by the yearly-auto-debit-only change,
 * mirroring ADR-094's Service Provider narrowing) — a free plan (server-side price 0) activates
 * directly, never reaching Razorpay. The Rider test account (`TEST_RIDER_PHONE`) still gets the
 * simulated checkout for a paid plan, since it can't complete a real Razorpay Subscription mandate
 * authorization during app-store review. Every other paid-plan request is rejected outright: Rider
 * membership only ever charges through a real Razorpay Subscription
 * (`POST /api/membership/subscription`), never a one-time order — `/api/partner-membership/
 * checkout` (Service Provider) is untouched and was narrowed the same way first.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = checkoutMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await MembershipService.getPlanById(parsed.data.planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.price === 0) {
    return NextResponse.json({ razorpayConfigured: false, free: true });
  }

  // The store-review/QA Rider test account never goes to Razorpay: it gets the simulated checkout
  // (web shows the test card form, mobile activates directly), which `/purchase` accepts for this
  // account only.
  if (MembershipService.isPaymentExemptTestAccount(session.user.phoneNumber)) {
    return NextResponse.json({ razorpayConfigured: false, testAccount: true });
  }

  // Rider membership is yearly-auto-debit-only — a real Rider never gets a one-time order for a
  // paid plan; `POST /api/membership/subscription` (a real Razorpay Subscription + mandate) is the
  // only paid path. Checked server-side so an old mobile build or a direct API call can't bypass
  // the UI's "Start Yearly Membership" button either.
  return NextResponse.json(
    {
      error: "ONE_TIME_CHECKOUT_DISABLED",
      message: "Membership is yearly auto-renewing only. Use the subscription endpoint to start it.",
    },
    { status: 403 },
  );
}
