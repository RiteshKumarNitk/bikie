import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** OWNER/MODERATOR sees every status (including PENDING requests to decide on); any other
 * APPROVED member sees only APPROVED members, never other Riders' pending/rejected requests —
 * see findMembersForViewer's own doc comment. A non-member gets `null` → 403. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const members = await getCommunityModule().community.getMembers(id, session.user.id);
  if (members === null) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  return NextResponse.json({ members });
}
