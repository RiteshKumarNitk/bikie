import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { sosAlertCancelSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

/** §28 of the master product spec — the reporter (or an admin) cancels an SOS while it's being
 * dispatched. Backend-side it stops further dispatch, expires outstanding offers, ends an
 * assigned helper's active session if one exists, notifies everyone mid-response, and records
 * the SOS_CANCELLED timeline event. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const parsed = sosAlertCancelSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await SOSService.cancelAlert(id, session.user.id, session.user.role === "ADMIN", parsed.data.reason);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : result.reason === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
