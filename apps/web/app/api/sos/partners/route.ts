import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Backs "Share Mechanic" / "Share Fuel Contact" quick-actions on an open SOS session.
 * Partner has no lat/lng today — city-scoped only, a known limitation. */
export async function GET(request: Request) {
  const { error } = await requireMembership();
  if (error) return error;

  const url = new URL(request.url);
  const city = url.searchParams.get("city");
  const type = url.searchParams.get("type") ?? undefined;
  if (!city) return NextResponse.json({ error: "CITY_REQUIRED" }, { status: 400 });

  const partners = await SOSService.findNearbyPartners(city, type);
  return NextResponse.json({ partners });
}
