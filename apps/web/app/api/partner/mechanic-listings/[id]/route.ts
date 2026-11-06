import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { updateMechanicListingSchema } from "@bikie/validation";
import { requirePartnerCapability } from "@/lib/require-role";

const REASON_STATUS: Record<string, number> = { NOT_A_PARTNER: 403, WRONG_PARTNER_TYPE: 403, NOT_FOUND: 404 };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;
  const { id } = await params;

  const parsed = updateMechanicListingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getMechanicMarketplaceModule().listings.updateListing(session.user.id, id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ listing: result.listing });
}

/** Deliberately never a hard delete — deactivates the listing so every existing
 * MechanicServiceRequest against it (with its own quotedPrice snapshot) stays intact. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;
  const { id } = await params;

  const result = await getMechanicMarketplaceModule().listings.deactivateListing(session.user.id, id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ success: true });
}
