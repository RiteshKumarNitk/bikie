import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** A rider's own currently-open alert(s) — for a "your active SOS alert" Home banner. Unlike
 * `GET /api/sos/alerts` (the location-gated nearby-community browse list), this needs no GPS fix
 * and only ever returns this caller's own alerts. */
export async function GET() {
  const { session, error } = await requireMembership();
  if (error) return error;

  const alerts = await SOSService.getMyActiveAlerts(session.user.id);
  return NextResponse.json({ alerts });
}
