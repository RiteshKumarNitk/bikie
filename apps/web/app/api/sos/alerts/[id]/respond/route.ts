import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireMembership } from "@/lib/require-role";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const { id } = await params;
  const body = await _request.json();
  await SOSService.respondToAlert(id, session.user.id, body.message);
  return NextResponse.json({ success: true });
}