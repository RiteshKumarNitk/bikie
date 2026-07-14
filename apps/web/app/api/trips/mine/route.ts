import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const [organized, joined, requested, stats] = await Promise.all([
    TripService.getOrganizedBy(session.user.id),
    TripService.getJoinedBy(session.user.id),
    TripService.getRequestedBy(session.user.id),
    TripService.getStats(session.user.id),
  ]);

  return NextResponse.json({ organized, joined, requested, stats });
}
