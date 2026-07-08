import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { requireRole } from "@/lib/require-role";

export async function GET() {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const profile = await PartnerService.getProfile(session.user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const body = await request.json();
  const profile = await PartnerService.upsertProfile(session.user.id, {
    businessName: body.businessName,
    type: body.type,
    city: body.city,
    description: body.description,
  });
  return NextResponse.json({ profile });
}
