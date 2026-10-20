import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

const ERROR_STATUS: Record<string, number> = {
  NO_ACTIVE_SUBSCRIPTION: 404,
  CANCEL_FAILED: 503,
};

/**
 * `POST /api/partner-membership/subscription/cancel` — stops future recurring charges
 * (`cancelAtCycleEnd: true`). Never retroactively revokes the already-paid-for current period:
 * `PartnerMembershipService.cancelSubscription` leaves `status`/`endDate` untouched, so
 * eligibility keeps working exactly until the existing `endDate` naturally passes.
 */
export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  const result = await PartnerMembershipService.cancelSubscription(session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: ERROR_STATUS[result.reason] ?? 400 });
  }
  return NextResponse.json({ membership: result.membership });
}
