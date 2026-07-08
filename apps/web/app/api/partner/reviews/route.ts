import { NextResponse } from "next/server";
import { ReviewService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const reviews = await ReviewService.getForOwner(session.user.id);
  return NextResponse.json({ reviews });
}
