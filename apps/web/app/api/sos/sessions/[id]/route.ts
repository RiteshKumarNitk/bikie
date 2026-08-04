import { NextResponse } from "next/server";
import { SOSSessionService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const result = await SOSSessionService.getSession(id, session.user.id, session.user.role === "ADMIN");
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ session: result.session });
}
