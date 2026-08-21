import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requirePartnerCapability } from "@/lib/require-role";

/** The partner's own outstanding offers — made, but not yet accepted/rejected/withdrawn/expired,
 * on an alert still open. Without this, an offer disappears from "Nearby Requests" the moment
 * it's made and never appears in "Active Assistance" unless the rider accepts it. */
export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const offers = await SOSSessionService.listPendingOffers(session.user.id);
  return NextResponse.json({ offers });
}
