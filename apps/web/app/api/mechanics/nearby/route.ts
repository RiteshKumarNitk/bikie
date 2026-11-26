import { NextResponse } from "next/server";
import { getMechanicMarketplaceModule } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

/** Public discovery of active Mechanic listings — any authenticated Rider, no membership gate
 * (mirrors `/api/partners/nearby`'s posture: discovery itself is open, only actions beyond it
 * are gated). Never returns a deactivated listing — see getMechanicListingDetail/discoverListings. */
export async function GET(request: Request) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const maxPriceRaw = searchParams.get("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

  const listings = await getMechanicMarketplaceModule().listings.discoverListings({
    category,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
  });
  return NextResponse.json({ listings });
}
