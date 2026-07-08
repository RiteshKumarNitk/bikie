import { NextResponse } from "next/server";
import { MembershipService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const membership = await MembershipService.getActiveMembership(session.user.id);
  return NextResponse.json({ membership });
}