import { NextResponse } from "next/server";
import { SOSService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const alerts = await SOSService.getAlertHistory(session.user.id);
  return NextResponse.json({ alerts });
}