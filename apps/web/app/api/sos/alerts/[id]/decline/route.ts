import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { sosDeclineSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

/** A responder (typically a partner browsing "Nearby Requests") declines without ever offering
 * (ADR-045) — a persisted decision, not a local UI-only dismissal. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const parsed = sosDeclineSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await SOSSessionService.declineAlert(id, session.user.id, parsed.data.message);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
