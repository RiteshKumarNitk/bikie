import { NextResponse } from "next/server";
import { PartnerService } from "@bikie/services";
import { partnerAvailabilitySchema } from "@bikie/validation";
import { requireRole } from "@/lib/require-role";

/** ADR-044 — the "🟢 Available / ⚫ Offline" toggle. */
export async function PATCH(request: Request) {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  const parsed = partnerAvailabilitySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await PartnerService.setAvailability(session.user.id, parsed.data.isAvailable);
  return NextResponse.json(result);
}
