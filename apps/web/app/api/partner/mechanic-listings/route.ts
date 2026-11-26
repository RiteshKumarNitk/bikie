import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { createMechanicListingSchema } from "@bikie/validation";
import { requirePartnerCapability } from "@/lib/require-role";

const REASON_STATUS: Record<string, number> = { NOT_A_PARTNER: 403, WRONG_PARTNER_TYPE: 403 };

/** The Partner's own listings — `requirePartnerCapability` confirms general Service-Provider
 * capability; the MECHANIC-type check happens again inside the application layer regardless
 * (never trusts this route alone), see mechanic-listing.application.ts's authorizeMechanicPartner. */
export async function GET() {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const result = await getMechanicMarketplaceModule().listings.getOwnListings(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ listings: result.listings });
}

export async function POST(request: Request) {
  const { session, error } = await requirePartnerCapability();
  if (error) return error;

  const parsed = createMechanicListingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getMechanicMarketplaceModule().listings.createListing(session.user.id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: REASON_STATUS[result.reason] ?? 400 });
  return NextResponse.json({ listing: result.listing }, { status: 201 });
}
