import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { error } = await requireSession();
  if (error) return error;
  const { listingId } = await params;

  const listing = await getMechanicMarketplaceModule().listings.getListingDetail(listingId);
  if (!listing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ listing });
}
