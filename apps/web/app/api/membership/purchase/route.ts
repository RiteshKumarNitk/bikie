import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const membership = await MembershipService.purchaseMembership(session.user.id, body.planId, body.paymentId);
  return NextResponse.json({ membership });
}