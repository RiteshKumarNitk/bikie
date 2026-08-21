import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireSosAccess } from "@/lib/require-role";

/** Deprecated alias — kept only so older clients still work (ADR-028: no facade deletion
 * without zero-use proof). New callers should use POST /api/sos/alerts/[id]/offer. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSosAccess();
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await SOSSessionService.offerHelp(id, session.user.id, undefined, body.message);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
