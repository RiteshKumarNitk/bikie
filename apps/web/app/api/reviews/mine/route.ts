import { NextResponse } from "next/server";
import { ReviewService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const reviews = await ReviewService.getForUser(session.user.id);
  return NextResponse.json({ reviews });
}
