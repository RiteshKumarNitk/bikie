import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** Every group this Rider owns or has ANY membership row for — any status, including their own
 * outstanding PENDING join requests — regardless of public/private. */
export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const groups = await getCommunityModule().community.getMyGroups(session.user.id);
  return NextResponse.json({ groups });
}
