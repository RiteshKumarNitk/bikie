import { NextResponse } from "next/server";
import { RiderLocationService } from "@bikie/services";
import { riderLocationConsentSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

export async function PUT(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const parsed = riderLocationConsentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await RiderLocationService.setSharing(session.user.id, parsed.data.enabled);
  return NextResponse.json({ success: true, enabled: parsed.data.enabled });
}

export async function GET() {
  const { session, error } = await requireMembership();
  if (error) return error;

  const enabled = await RiderLocationService.getSharing(session.user.id);
  return NextResponse.json({ enabled });
}
