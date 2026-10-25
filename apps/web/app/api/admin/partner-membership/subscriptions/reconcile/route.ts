import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
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
 * invoice (`createRecurringPartnerInvoice` is keyed on `razorpayPaymentId` alone).
 */
export async function POST(request: Request) {
  const { session, error } = await requireRole("ADMIN");
  if (error) return error;

  const parsed = reconcilePartnerSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await PartnerMembershipService.reconcileSubscription(parsed.data.razorpaySubscriptionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: ERROR_STATUS[result.reason] ?? 400 });
  }

  await logAdminAction({
    userId: session.user.id,
    action: "RECONCILE_PARTNER_SUBSCRIPTION",
    entity: "PartnerMembership",
    entityId: result.membership.id,
    metadata: { razorpaySubscriptionId: parsed.data.razorpaySubscriptionId, invoicesFound: result.invoicesFound },
  });

  return NextResponse.json({ membership: result.membership, invoicesFound: result.invoicesFound });
}
