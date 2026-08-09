import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireApprovedPartner } from "@/lib/require-role";

/** ADR-044 — stat row for the partner Emergency Assistance Dashboard Home screen. `?lat=&lng=`
 * are optional: without them, `activeRequests` reports 0 rather than the route failing outright. */
export async function GET(request: Request) {
  const { session, error } = await requireApprovedPartner();
  if (error) return error;

  const url = new URL(request.url);
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const lat = latParam !== null ? Number(latParam) : NaN;
  const lng = lngParam !== null ? Number(lngParam) : NaN;
  const location = Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;

  const stats = await SOSSessionService.getPartnerDashboard(session.user.id, location);
  return NextResponse.json({ stats });
}
