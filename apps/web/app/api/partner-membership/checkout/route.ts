import { NextResponse } from "next/server";
import { PartnerMembershipService, RazorpayService } from "@bikie/services";
import { checkoutPartnerMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/partner-membership/checkout` (ADR-051) — mirrors `POST /api/membership/checkout`
 * exactly, against the separate Partner plan table. A free plan (server-side price 0) never
 * reaches Razorpay at all — the client shouldn't be calling this for a free plan (it purchases
 * directly), but the check is server-side regardless, never a client-asserted flag.
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

  if (!RazorpayService.isConfigured()) {
    return NextResponse.json({ razorpayConfigured: false });
  }

  const order = await RazorpayService.createOrder(plan.price, `partner_membership_${session.user.id}_${Date.now()}`);
  if (!order) {
    return NextResponse.json({ error: "CHECKOUT_UNAVAILABLE", message: "Payment checkout is unavailable right now." }, { status: 503 });
  }

  return NextResponse.json({ razorpayConfigured: true, order, plan: { id: plan.id, name: plan.name, price: plan.price } });
}
