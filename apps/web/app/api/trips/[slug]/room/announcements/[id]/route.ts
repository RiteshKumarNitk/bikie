import { NextResponse } from "next/server";
import { RideRoomService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";
import { statusForRideRoomError } from "@/lib/ride-room-status";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug, id } = await params;
  const result = await RideRoomService.deleteAnnouncement(slug, id, session.user.id, session.user.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: statusForRideRoomError(result.reason) });
  }
  return NextResponse.json({ success: true });
}
