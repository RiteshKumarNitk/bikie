import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const [organized, joined] = await Promise.all([
    TripService.getOrganizedBy(session.user.id),
    TripService.getJoinedBy(session.user.id),
  ]);

  return NextResponse.json({ organized, joined });
}
