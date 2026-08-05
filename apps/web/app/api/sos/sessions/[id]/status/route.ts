import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { sosSessionStatusSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

/** Timeline transitions: Helper Arrived / Assistance Started / Completed / Cancelled.
 * Ownership rule enforced in the application layer — helper drives ARRIVED/IN_PROGRESS,
 * rider drives COMPLETED, either can CANCEL, admin can always override. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const parsed = sosSessionStatusSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await SOSSessionService.updateSessionStatus(
    id,
    parsed.data.status,
    session.user.id,
    session.user.role === "ADMIN",
    parsed.data.cancelReason,
  );
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ session: result.session });
}
