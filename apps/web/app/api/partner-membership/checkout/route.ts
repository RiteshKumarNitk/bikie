import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { checkoutPartnerMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/partner-membership/checkout` (ADR-051, narrowed by the monthly-auto-debit-only
 * change) — a free plan (server-side price 0) activates directly, never reaching Razorpay. The
 * ADR-089 test account still gets the simulated checkout for a paid plan. Every other paid-plan
 * request is now rejected outright: Service Provider membership only ever charges through a real
 * Razorpay Subscription (`POST /api/partner-membership/subscription`), never a one-time order —
 * `/api/membership/checkout` (Rider) is untouched and still creates real one-time orders.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = checkoutPartnerMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await PartnerMembershipService.getPlanById(parsed.data.planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.price === 0) {
    return NextResponse.json({ razorpayConfigured: false, free: true });
  }

  // ADR-089 — the store-review/QA Service Provider test account never goes to Razorpay: it gets
  // the simulated checkout (web shows the test card form, mobile activates directly), which
  // `/purchase` accepts for this account only.
  if (PartnerMembershipService.isPaymentExemptTestAccount(session.user.phoneNumber)) {
    return NextResponse.json({ razorpayConfigured: false, testAccount: true });
  }

  // Service Provider membership is monthly-auto-debit-only — a real SP never gets a one-time
  // order for a paid plan; `POST /api/partner-membership/subscription` (a real Razorpay
  // Subscription + mandate) is the only paid path. Checked server-side so an old mobile build or
  // a direct API call can't bypass the UI's "Start Membership" button either. Riders are
  // untouched — this route is Service-Provider-only (`/api/membership/*` is the separate Rider
  // route tree). Everything below this point in the previous one-time-order flow (RazorpayService.
  // isConfigured()/createOrder) is unreachable for a real SP now that paid plans only reach this
  // route via the free/test-account branches above, so it's removed rather than left dead.
  return NextResponse.json(
    {
      error: "ONE_TIME_CHECKOUT_DISABLED",
      message: "Service Provider membership is monthly auto-renewing only. Use the subscription endpoint to start it.",
    },
    { status: 403 },
  );
}
