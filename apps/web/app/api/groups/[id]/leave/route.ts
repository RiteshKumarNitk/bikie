import { NextResponse } from "next/server";
import { getCommunityModule } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;
  const { id } = await params;

  const result = await getCommunityModule().community.leaveGroup(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });
  return NextResponse.json({ success: true });
}
