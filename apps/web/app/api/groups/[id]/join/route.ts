import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { joinGroupSchema } from "@bikie/validation";
import { requireSession } from "@/lib/require-role";

/** Public group → APPROVED immediately. Private group → PENDING, owner/moderator decides via
 * PATCH /api/groups/[id]/members/[userId]. Upserts the SAME (groupId, userId) row every time, so
 * leaving and rejoining later never creates a duplicate membership record — see
 * CommunityRepositoryPort.upsertMembership's doc comment. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const parsed = joinGroupSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getCommunityModule().community.joinGroup(id, session.user.id, parsed.data.message);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });
  return NextResponse.json({ membership: result.membership });
}
