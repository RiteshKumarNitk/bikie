import { NextResponse } from "next/server";
import { RiderLocationService } from "@bikie/services";
import { riderSosOptOutSchema } from "@bikie/validation";
import { requireMembership } from "@/lib/require-role";

/** ADR-045 — independent of `/api/rider-location/consent` (live location sharing): whether this
 * rider should be paged as an SOS dispatch candidate at all. */
export async function PUT(request: Request) {
  const { session, error } = await requireMembership();
  if (error) return error;

  const parsed = riderSosOptOutSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await RiderLocationService.setReceiveSosAlerts(session.user.id, parsed.data.enabled);
  return NextResponse.json({ success: true, enabled: parsed.data.enabled });
}

export async function GET() {
  const { session, error } = await requireMembership();
  if (error) return error;

  const enabled = await RiderLocationService.getReceiveSosAlerts(session.user.id);
  return NextResponse.json({ enabled });
}
