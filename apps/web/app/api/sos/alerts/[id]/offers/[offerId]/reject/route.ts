import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Rider (or admin) declines a specific helper's offer without assigning them. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; offerId: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id, offerId } = await params;
  const result = await SOSSessionService.rejectOffer(id, offerId, session.user.id, session.user.role === "ADMIN");
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
