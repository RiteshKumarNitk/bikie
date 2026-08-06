import { NextResponse } from "next/server";
import { MembershipService, RazorpayService } from "@bikie/services";
import { purchaseMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

// ADR-043: once Razorpay is configured (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET both set), a bare
// client-supplied `paymentId` is never trusted again — real money means real verification. The
// pre-Razorpay simulated-checkout shape (`paymentId` alone) only works while `isConfigured()` is
// false; this is a server-side gate, not a client opt-out, so an old/unpatched client can't keep
// using the dummy path once real keys are live.
export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const parsed = purchaseMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { planId, paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

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
    const membership = await MembershipService.purchaseMembership(
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
  const membership = await MembershipService.purchaseMembership(session.user.id, planId, paymentId);
  return NextResponse.json({ membership });
}