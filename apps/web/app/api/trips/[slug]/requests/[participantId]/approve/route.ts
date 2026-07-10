import { NextResponse } from "next/server";
import { TripService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(_req: Request, { params }: { params: Promise<{ participantId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { participantId } = await params;
  const result = await TripService.decideRequest(participantId, session.user.id, "APPROVED");
  if (!result.ok) {
    const status =
      result.reason === "NOT_FOUND"
        ? 404
        : result.reason === "FORBIDDEN"
          ? 403
          : result.reason === "NO_SEATS"
            ? 409
            : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ success: true });
}
