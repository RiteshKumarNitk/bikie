import { NextResponse } from "next/server";
import { ReviewService } from "@bikie/services";
import { requireApprovedPartner } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireApprovedPartner();
  if (error) return error;

  const reviews = await ReviewService.getForOwner(session.user.id);
  return NextResponse.json({ reviews });
}
