import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { adminCancelPartnerSubscriptionSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  CANCEL_FAILED: 503,
};

const ERROR_MESSAGE: Record<string, string> = {
  NOT_FOUND: "No BIKIE membership has this Razorpay subscription id.",
  CANCEL_FAILED: "Razorpay did not confirm the cancellation. Please try again.",
};

/**
 * `POST /api/admin/partner-membership/subscriptions/cancel` — admin-triggered cancellation of
 * ANY Service Provider's subscription (not scoped to the calling admin), identified by its
 * Razorpay Subscription id. Same `cancelAtCycleEnd: true` semantics as the SP's own self-service
 * cancellation: stops future automatic debits, never retroactively revokes the already-paid-for
 * current period.
 */
export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = adminCancelPartnerSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await PartnerMembershipService.adminCancelSubscription(parsed.data.razorpaySubscriptionId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, message: ERROR_MESSAGE[result.reason] },
      { status: ERROR_STATUS[result.reason] ?? 400 },
    );
  }

  await logAdminAction({
    userId: session.user.id,
    action: "CANCEL_PARTNER_SUBSCRIPTION",
    entity: "PartnerMembership",
    entityId: result.membership.id,
    metadata: { razorpaySubscriptionId: parsed.data.razorpaySubscriptionId },
  });

  return NextResponse.json({ membership: result.membership });
}
