import { NextResponse } from "next/server";
import { ReferralService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  if (!body.code || typeof body.code !== "string") {
    return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
  }

  const linked = await ReferralService.linkReferral(session.user.id, body.code);
  return NextResponse.json({ linked });
}
