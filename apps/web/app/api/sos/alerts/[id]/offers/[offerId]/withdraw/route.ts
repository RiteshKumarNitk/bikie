import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Helper taps "Cannot Help" on their own offer. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; offerId: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { offerId } = await params;
  const result = await SOSSessionService.withdrawOffer(offerId, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
  return NextResponse.json({ success: true });
}
