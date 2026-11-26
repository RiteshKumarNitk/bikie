import type { MechanicMarketplacePorts, MechanicListingRow } from "../ports";

export type ListingAuthFailureReason = "NOT_A_PARTNER" | "WRONG_PARTNER_TYPE";

export type ListingAuthResult = { ok: true; partnerId: string } | { ok: false; reason: ListingAuthFailureReason };

/** Every mutation below re-derives the caller's Partner row from their own `userId` and checks
 * `type === "MECHANIC"` itself — never trusts a `partnerId` the client could pass, and never
 * relies solely on whatever the HTTP route layer already checked (`requirePartnerCapability`
 * confirms Service-Provider capability generally, not this specific listing type). */
async function authorizeMechanicPartner(
  ports: MechanicMarketplacePorts,
  userId: string,
): Promise<ListingAuthResult> {
  const partner = await ports.partners.findPartnerByUserId(userId);
  if (!partner) return { ok: false, reason: "NOT_A_PARTNER" };
  if (partner.type !== "MECHANIC") return { ok: false, reason: "WRONG_PARTNER_TYPE" };
  return { ok: true, partnerId: partner.id };
}

export function createMechanicListingApplication(ports: MechanicMarketplacePorts) {
  return {
    async createListing(
      userId: string,
      input: {
        title: string;
        description: string;
        category: string;
        price: number;
        imageUrls: string[];
        latitude?: number | null;
        longitude?: number | null;
        serviceRadiusKm?: number;
      },
    ): Promise<{ ok: true; listing: MechanicListingRow } | { ok: false; reason: ListingAuthFailureReason }> {
      const auth = await authorizeMechanicPartner(ports, userId);
      if (!auth.ok) return auth;
      const listing = await ports.listings.createListing({ ...input, partnerId: auth.partnerId });
      return { ok: true, listing };
    },

    async updateListing(
      userId: string,
      listingId: string,
      data: Partial<{
        title: string;
        description: string;
        category: string;
        price: number;
        imageUrls: string[];
        latitude: number | null;
        longitude: number | null;
        serviceRadiusKm: number;
      }>,
    ): Promise<{ ok: true; listing: MechanicListingRow } | { ok: false; reason: ListingAuthFailureReason | "NOT_FOUND" }> {
      const auth = await authorizeMechanicPartner(ports, userId);
      if (!auth.ok) return auth;
      const listing = await ports.listings.updateOwnListing(listingId, auth.partnerId, data);
      if (!listing) return { ok: false, reason: "NOT_FOUND" };
      return { ok: true, listing };
    },

    /** Never a real delete — see MechanicListingRepositoryPort.deactivateOwnListing's own doc
     * comment: every existing MechanicServiceRequest against this listing (with its quotedPrice
     * snapshot) must survive the listing being pulled. */
    async deactivateListing(
      userId: string,
      listingId: string,
    ): Promise<{ ok: true } | { ok: false; reason: ListingAuthFailureReason | "NOT_FOUND" }> {
      const auth = await authorizeMechanicPartner(ports, userId);
      if (!auth.ok) return auth;
      const deactivated = await ports.listings.deactivateOwnListing(listingId, auth.partnerId);
      if (!deactivated) return { ok: false, reason: "NOT_FOUND" };
      return { ok: true };
    },

    async reactivateListing(
      userId: string,
      listingId: string,
    ): Promise<{ ok: true } | { ok: false; reason: ListingAuthFailureReason | "NOT_FOUND" }> {
      const auth = await authorizeMechanicPartner(ports, userId);
      if (!auth.ok) return auth;
      const listing = await ports.listings.updateOwnListing(listingId, auth.partnerId, { isActive: true });
      if (!listing) return { ok: false, reason: "NOT_FOUND" };
      return { ok: true };
    },

    async getOwnListings(userId: string): Promise<{ ok: true; listings: MechanicListingRow[] } | { ok: false; reason: ListingAuthFailureReason }> {
      const auth = await authorizeMechanicPartner(ports, userId);
      if (!auth.ok) return auth;
      const listings = await ports.listings.findOwnListings(auth.partnerId);
      return { ok: true, listings };
    },

    /** Public discovery — active listings only, no ownership check (any authenticated Rider). */
    async discoverListings(filters: { category?: string; maxPrice?: number }): Promise<MechanicListingRow[]> {
      return ports.listings.findNearbyActiveListings(filters);
    },

    async getListingDetail(listingId: string): Promise<MechanicListingRow | null> {
      const listing = await ports.listings.findListingById(listingId);
      // Deactivated listings aren't shown to Riders browsing by id either — only the owning
      // Partner sees them (via getOwnListings), consistent with discoverListings already
      // excluding them from search.
      if (!listing || !listing.isActive) return null;
      return listing;
    },
  };
}
