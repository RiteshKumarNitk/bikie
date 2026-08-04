import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Reporter (or admin) reviewing who's offered to help — phone numbers stay hidden until
 * a specific offer is accepted (session participants only, not just "offered"). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const result = await SOSSessionService.listOffers(id, session.user.id, session.user.role === "ADMIN");
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }

  const isPrivileged = session.user.role === "ADMIN";
  const offers = result.offers.map((o) => ({
    id: o.id,
    alertId: o.alertId,
    responderId: o.responderId,
    responderName: o.responder.name,
    // Phone withheld pre-accept — a helper who's only offered isn't confirmed yet.
    responderPhone: isPrivileged || o.status === "ACCEPTED" ? o.responder.phone : null,
    status: o.status,
    distanceMeters: o.distanceMeters,
    etaMinutes: o.etaMinutes,
    message: o.message,
    createdAt: o.createdAt,
  }));
  return NextResponse.json({ offers });
}
