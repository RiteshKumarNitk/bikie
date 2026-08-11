import { NextResponse } from "next/server";
import { PartnerMembershipService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const membership = await PartnerMembershipService.getActiveMembership(session.user.id);
  return NextResponse.json({ membership });
}
