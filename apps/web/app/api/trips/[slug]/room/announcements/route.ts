import { NextResponse } from "next/server";
import { RideRoomService } from "@bikie/services";
import { announcementSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";
import { statusForRideRoomError } from "@/lib/ride-room-status";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const result = await RideRoomService.getAnnouncements(slug, session.user.id, session.user.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: statusForRideRoomError(result.reason) });
  }
  return NextResponse.json({ announcements: result.data });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { slug } = await params;
  const parsed = announcementSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await RideRoomService.postAnnouncement(slug, session.user.id, session.user.role, parsed.data.content);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: statusForRideRoomError(result.reason) });
  }
  return NextResponse.json({ announcement: result.data });
}
