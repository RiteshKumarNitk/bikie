import { NextResponse } from "next/server";
import { ReferralService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const referral = await ReferralService.getMyReferralInfo(session.user.id);
  return NextResponse.json(referral);
}
