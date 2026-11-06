import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { updateGroupSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Private-group detail is only returned to an existing member (any status) or the owner — a
 * non-member gets `null` → 404, never a redacted-but-present response, so a stranger can't even
 * confirm a private group's details exist beyond whatever public summary (name/privacy flag)
 * they already had to have reached this id at all. See findGroupForViewer's own doc comment. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const group = await getCommunityModule().community.getGroupDetail(id, session.user.id);
  if (!group) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ group });
}

const REASON_STATUS: Record<string, number> = { NOT_FOUND: 404, FORBIDDEN: 403 };

/** Owner-only — enforced inside updateOwnGroup, not just here. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const parsed = updateGroupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getCommunityModule().community.updateGroup(id, session.user.id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ group: result.group });
}

/** Owner-only — enforced inside deleteOwnGroup, not just here. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const result = await getCommunityModule().community.deleteGroup(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ success: true });
}
