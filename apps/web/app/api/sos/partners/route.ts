import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Backs "Share Mechanic" / "Share Fuel Contact" quick-actions on an open SOS session.
 * Radius-based off the alert's own lat/lng (the caller already has these, from the same alert
 * object it read `city` from before) — previously city-string matched, which could hide a
 * genuinely nearby partner over a free-text spelling/casing mismatch between the rider's and
 * partner's own `city` fields. */
export async function GET(request: Request) {
  const { error } = await requireMembership();
  if (error) return error;

  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lng"));
  const type = url.searchParams.get("type") ?? undefined;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "LOCATION_REQUIRED" }, { status: 400 });
  }

  const partners = await SOSService.findNearbyPartners(latitude, longitude, type);
  return NextResponse.json({ partners });
}
