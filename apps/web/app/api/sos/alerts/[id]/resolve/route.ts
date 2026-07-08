import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  await SOSService.resolveAlert(id, session.user.id);
  return NextResponse.json({ success: true });
}