import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const result = await TripService.getGroup(slug, session.user.id);
  if (!result.ok) {
    const status = result.reason === "TRIP_NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 404;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ conversationId: result.conversationId });
}
