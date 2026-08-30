import { NextResponse } from "next/server";
import { MembershipService, RazorpayService } from "@bikie/services";
import { checkoutMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/membership/checkout` (ADR-043) — creates a real Razorpay order for a plan, priced
 * server-side (never trusts a client-supplied amount). While Razorpay isn't configured (no live
 * keys yet), returns `{ razorpayConfigured: false }` and nothing else — the client's existing
 * simulated-checkout flow (`PaymentModal.tsx`) keeps working exactly as it did before this
 * existed, unchanged, and posts straight to `/api/membership/purchase` with a dummy `paymentId`.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = checkoutMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!RazorpayService.isConfigured()) {
    // ADR-069 — in production, unconfigured Razorpay means payments are unavailable, not that
    // the simulated (no-charge) checkout should stand in. Only dev/preview falls back.
    if (!RazorpayService.isDevFallbackAllowed()) {
      return NextResponse.json(
        { error: "PAYMENTS_UNAVAILABLE", message: "Payments are temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    return NextResponse.json({ razorpayConfigured: false });
  }

  const plan = await MembershipService.getPlanById(parsed.data.planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  const order = await RazorpayService.createOrder(plan.price, `membership_${session.user.id}_${Date.now()}`);
  if (!order) {
    return NextResponse.json({ error: "CHECKOUT_UNAVAILABLE", message: "Payment checkout is unavailable right now." }, { status: 503 });
  }

  return NextResponse.json({ razorpayConfigured: true, order, plan: { id: plan.id, name: plan.name, price: plan.price } });
}
