import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** `pendingSubscription` is only ever checked (and only ever non-null) when `membership` is
 * `null` — a subscription that's been created but not yet webhook-confirmed charged, so the
 * client can show "payment pending" honestly instead of looking exactly like no purchase was
 * ever attempted. See `MembershipService.getPendingSubscription`. */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const membership = await MembershipService.getActiveMembership(session.user.id);
  const pendingSubscription = membership ? null : await MembershipService.getPendingSubscription(session.user.id);
  return NextResponse.json({ membership, pendingSubscription });
}