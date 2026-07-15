import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { partnerProfileSchema } from "@bikie/validation";
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

  const parsed = partnerProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await PartnerService.upsertProfile(session.user.id, parsed.data);
  return NextResponse.json({ profile });
}
