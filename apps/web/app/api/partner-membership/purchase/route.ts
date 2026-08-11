import { NextResponse } from "next/server";
import { PartnerMembershipService, RazorpayService } from "@bikie/services";
import { purchasePartnerMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/**
 * `POST /api/partner-membership/purchase` (ADR-051) — mirrors `POST /api/membership/purchase`,
 * plus a free-tier shortcut a Rider plan never needed: a plan whose server-side price is 0
 * activates immediately with no payment step at all, regardless of Razorpay configuration or
 * what the client sent — the price check happens here, never trusting a client-supplied "this is
 * free" claim.
 */
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = purchasePartnerMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { planId, paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const plan = await PartnerMembershipService.getPlanById(planId);
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.price === 0) {
    const membership = await PartnerMembershipService.purchaseMembership(session.user.id, planId);
    return NextResponse.json({ membership });
  }

  if (RazorpayService.isConfigured()) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "PAYMENT_VERIFICATION_REQUIRED", message: "A verified payment is required to activate membership." },
        { status: 400 },
      );
    }
    const verified = RazorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!verified) {
      return NextResponse.json(
        { error: "PAYMENT_VERIFICATION_FAILED", message: "Payment could not be verified. Please try again." },
        { status: 400 },
      );
    }
    const membership = await PartnerMembershipService.purchaseMembership(
      session.user.id,
      planId,
      razorpayPaymentId,
      razorpayOrderId,
    );
    return NextResponse.json({ membership });
  }

  if (!paymentId) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "paymentId is required." },
      { status: 400 },
    );
  }
  const membership = await PartnerMembershipService.purchaseMembership(session.user.id, planId, paymentId);
  return NextResponse.json({ membership });
}
