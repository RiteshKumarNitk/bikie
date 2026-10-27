import { NextResponse } from "next/server";
import { MembershipService, PartnerMembershipService, SubscriptionWebhookRouter } from "@bikie/services";
import { adminCancelPartnerSubscriptionSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

const ERROR_MESSAGE: Record<string, string> = {
  NOT_FOUND: "No BIKIE membership has this Razorpay subscription id.",
  CANCEL_FAILED: "Razorpay did not confirm the cancellation. Please try again.",
};

/**
 * `POST /api/admin/partner-membership/subscriptions/cancel` — admin-triggered cancellation of
 * ANY subscription (not scoped to the calling admin), identified by its Razorpay Subscription
 * id. Same `cancelAtCycleEnd: true` semantics as the owner's own self-service cancellation: stops
 * future automatic debits, never retroactively revokes the already-paid-for current period.
 *
 * Shared across BOTH recurring membership types (URL kept for backward compatibility with the
 * existing UI) — `SubscriptionWebhookRouter.resolveAccountType` decides whether this is a Rider
 * (₹149/year) or Service Provider (₹99/month) subscription before delegating.
 */
export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = adminCancelPartnerSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { razorpaySubscriptionId } = parsed.data;
  const accountType = await SubscriptionWebhookRouter.resolveAccountType(razorpaySubscriptionId);
  if (!accountType) {
    return NextResponse.json({ error: "NOT_FOUND", message: ERROR_MESSAGE.NOT_FOUND }, { status: 404 });
  }

  const service = accountType === "RIDER" ? MembershipService : PartnerMembershipService;
  const result = await service.adminCancelSubscription(razorpaySubscriptionId);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, message: ERROR_MESSAGE[result.reason] },
      { status: result.reason === "CANCEL_FAILED" ? 503 : 404 },
    );
  }

  await logAdminAction({
    userId: session.user.id,
    action: "CANCEL_SUBSCRIPTION",
    entity: accountType === "RIDER" ? "UserMembership" : "PartnerMembership",
    entityId: result.membership.id,
    metadata: { razorpaySubscriptionId, accountType },
  });

  return NextResponse.json({ membership: result.membership, accountType });
}
