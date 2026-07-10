import { NextResponse } from "next/server";
import { RideRoomService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";
import { statusForRideRoomError } from "@/lib/ride-room-status";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const url = new URL(request.url);
  const typeParam = url.searchParams.get("type");
  const type = typeParam === "IMAGE" || typeParam === "DOCUMENT" ? typeParam : undefined;

  const result = await RideRoomService.getMedia(slug, session.user.id, session.user.role, type);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: statusForRideRoomError(result.reason) });
  }
  return NextResponse.json({ media: result.data });
}
