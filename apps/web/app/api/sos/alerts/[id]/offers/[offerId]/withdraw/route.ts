import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireSosAccess } from "@/lib/require-role";

/** Helper taps "Cannot Help" on their own offer. `requireSosAccess`, not `requireMembership`:
 * the helper withdrawing may be a Service Provider with a Partner membership. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; offerId: string }> }) {
  const { session, error } = await requireSosAccess();
  if (error) return error;

  const { offerId } = await params;
  const result = await SOSSessionService.withdrawOffer(offerId, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
  return NextResponse.json({ success: true });
}
