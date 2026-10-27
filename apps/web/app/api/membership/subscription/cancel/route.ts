import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

const ERROR_STATUS: Record<string, number> = {
  NO_ACTIVE_SUBSCRIPTION: 404,
  CANCEL_FAILED: 503,
};

/**
 * `POST /api/membership/subscription/cancel` — stops future recurring charges
 * (`cancelAtCycleEnd: true`). Never retroactively revokes the already-paid-for current period:
 * `MembershipService.cancelSubscription` leaves `status`/`endDate` untouched, so eligibility
 * keeps working exactly until the existing `endDate` naturally passes. Mirrors
 * `/api/partner-membership/subscription/cancel` exactly.
 */
export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  const result = await MembershipService.cancelSubscription(session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: ERROR_STATUS[result.reason] ?? 400 });
  }
  return NextResponse.json({ membership: result.membership });
}
