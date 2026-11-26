import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { decideMembershipSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

const REASON_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  ALREADY_DECIDED: 409,
  ALREADY_REMOVED: 409,
  CANNOT_REMOVE_OWNER: 403,
};

/** Approve/reject a PENDING join request — OWNER/MODERATOR only, enforced inside
 * decideMembership via an atomic `WHERE status = PENDING` update, so two concurrent decisions on
 * the same request can't both "win"; the second gets ALREADY_DECIDED. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id, userId } = await params;

  const parsed = decideMembershipSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getCommunityModule().community.decideJoinRequest(id, userId, session.user.id, parsed.data.decision);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ success: true });
}

/** Remove an existing member — OWNER/MODERATOR only, same atomic-CAS guard, and the OWNER
 * themself can never be removed this way (ownership changes are a separate, deliberate action
 * this module doesn't build). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id, userId } = await params;

  const result = await getCommunityModule().community.removeMember(id, userId, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ success: true });
}
