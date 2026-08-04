import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Alert detail + timeline — same visibility posture as the active-alerts list (any member,
 * not just the reporter/admin; that list already shows full reporter contact info by city). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const alert = await SOSService.getAlertById(id);
  if (!alert) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const timeline = await SOSService.getTimeline(id);
  return NextResponse.json({ alert, timeline });
}
