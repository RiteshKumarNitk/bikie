import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { partnerNearbyQuerySchema } from "@bikie/validation";
import { requirePartnerCapability } from "@/lib/require-role";

/** ADR-044 — the partner's "Nearby Requests" list: open (unassigned) SOS alerts within range,
 * category-matched, only while verified + available. Returns an empty list rather than an error
 * for an offline/unverified partner (see partner-dashboard.application.ts). */
export async function GET(request: Request) {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const url = new URL(request.url);
  const parsed = partnerNearbyQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const requests = await SOSSessionService.listNearbyOpenRequests(session.user.id, {
    latitude: parsed.data.lat,
    longitude: parsed.data.lng,
  });
  return NextResponse.json({ requests });
}
