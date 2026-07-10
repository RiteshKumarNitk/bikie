import { NextResponse } from "next/server";
import { RideRoomService } from "@bikie/services";
import { meetingPointSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";
import { statusForRideRoomError } from "@/lib/ride-room-status";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const parsed = meetingPointSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await RideRoomService.updateMeetingPoint(slug, session.user.id, session.user.role, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: statusForRideRoomError(result.reason) });
  }
  return NextResponse.json({ success: true });
}
