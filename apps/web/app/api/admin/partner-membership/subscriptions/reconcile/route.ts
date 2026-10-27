import { NextResponse } from "next/server";
import { MembershipService, PartnerMembershipService, SubscriptionWebhookRouter } from "@bikie/services";
import { reconcilePartnerSubscriptionSchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";
import { logAdminAction } from "@/lib/audit";

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  COULD_NOT_VERIFY: 503,
};

/**
 * `POST /api/admin/partner-membership/subscriptions/reconcile` — the manual safety net for when
 * Razorpay's `subscription.charged`/`subscription.activated` webhook never reaches BIKIE (not
 * delivered, delivered while the app was down, a transient signature/env mismatch, …): replays
 * every PAID invoice Razorpay has recorded against the given subscription through the exact same
 * code path the webhook itself uses. Idempotent — running this on an already-up-to-date
 * subscription, or running it twice, is always a safe no-op, never a double charge or duplicate
 * invoice (`createRecurringInvoice` is keyed on `razorpayPaymentId` alone).
 *
 * Shared across BOTH recurring membership types (the URL still says "partner-membership" for
 * backward compatibility with the existing UI, but the underlying tool now handles either):
 * `SubscriptionWebhookRouter.resolveAccountType` looks up the given subscription id against both
 * `UserMembership` (Rider, ₹149/year) and `PartnerMembership` (Service Provider, ₹99/month)
 * before delegating to the matching service.
 */
export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = reconcilePartnerSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { razorpaySubscriptionId } = parsed.data;
  const accountType = await SubscriptionWebhookRouter.resolveAccountType(razorpaySubscriptionId);
  if (!accountType) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const service = accountType === "RIDER" ? MembershipService : PartnerMembershipService;
  const result = await service.reconcileSubscription(razorpaySubscriptionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: ERROR_STATUS[result.reason] ?? 400 });
  }

  await logAdminAction({
    userId: session.user.id,
    action: "RECONCILE_SUBSCRIPTION",
    entity: accountType === "RIDER" ? "UserMembership" : "PartnerMembership",
    entityId: result.membership.id,
    metadata: { razorpaySubscriptionId, invoicesFound: result.invoicesFound, accountType },
  });

  return NextResponse.json({ membership: result.membership, invoicesFound: result.invoicesFound, accountType });
}
