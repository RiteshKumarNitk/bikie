import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const overview = await TripService.getOverview(session.user.id);
  return NextResponse.json(overview);
}
