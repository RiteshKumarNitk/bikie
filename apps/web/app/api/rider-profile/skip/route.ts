import { NextResponse } from "next/server";
import { RiderProfileService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST() {
  const { session, error } = await requireSession();
  if (error) return error;

  await RiderProfileService.skip(session.user.id);
  return NextResponse.json({ success: true });
}
