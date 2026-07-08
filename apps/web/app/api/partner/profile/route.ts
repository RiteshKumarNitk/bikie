import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const profile = await PartnerService.getProfile(session.user.id);
  return NextResponse.json({ profile });
}
