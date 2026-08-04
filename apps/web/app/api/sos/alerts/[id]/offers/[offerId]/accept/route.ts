import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

/** Rider (or admin) accepts a specific helper's offer — the transactional assignment. Only
 * one accept can ever succeed per alert; a losing race gets 409, not a silent overwrite. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; offerId: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const rateLimitError = await enforceRateLimit("sos-offer", session.user.id, { requests: 10, windowSeconds: 300 });
  if (rateLimitError) return rateLimitError;

  const { id, offerId } = await params;
  const result = await SOSSessionService.acceptOffer(id, offerId, session.user.id, session.user.role === "ADMIN");
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ session: result.session });
}
