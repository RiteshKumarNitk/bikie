import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { sosRatingSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

/** Rider rates their helper after a completed session — the minimal reputation input (ADR-033). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const parsed = sosRatingSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await SOSSessionService.submitRating(id, session.user.id, parsed.data.rating, parsed.data.comment);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
