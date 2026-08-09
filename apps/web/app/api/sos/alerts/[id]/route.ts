import { NextResponse } from "next/server";
import { SOSService, SOSSessionService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

/** Alert detail + timeline — same visibility posture as the active-alerts list (any member,
 * not just the reporter/admin; that list already shows full reporter contact info by city).
 * The active session, if one exists, is only attached for its participants or an admin. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session: authSession, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  // ADR-045 — redacted (phone/email/exact location nulled) unless this viewer is the reporter,
  // the assigned helper, or an admin.
  const alert = await SOSService.getAlertById(id, {
    userId: authSession.user.id,
    isAdmin: authSession.user.role === "ADMIN",
  });
  if (!alert) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const timeline = await SOSService.getTimeline(id);

  let sosSession = null;
  if (alert.assignedHelperId) {
    const active = await SOSSessionService.getActiveSessionForAlert(id);
    const isAdmin = authSession.user.role === "ADMIN";
    const isParticipant =
      active && (active.helperId === authSession.user.id || active.riderId === authSession.user.id);
    if (active && (isParticipant || isAdmin)) sosSession = active;
  }

  return NextResponse.json({ alert, timeline, session: sosSession });
}
