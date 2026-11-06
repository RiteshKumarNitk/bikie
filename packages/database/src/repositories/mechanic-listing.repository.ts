import { prisma } from "../client";

export interface MechanicListingRow {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrls: string[];
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toRow(l: {
  id: string;
  partnerId: string;
  title: string;
  description: string;
  category: string;
  price: { toNumber: () => number };
  imageUrls: string[];
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MechanicListingRow {
  return { ...l, price: l.price.toNumber() };
}

export async function createListing(input: {
  partnerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrls: string[];
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number;
}): Promise<MechanicListingRow> {
  const created = await prisma.mechanicListing.create({
    data: {
      partnerId: input.partnerId,
      title: input.title,
      description: input.description,
      category: input.category,
      price: input.price,
      imageUrls: input.imageUrls,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      serviceRadiusKm: input.serviceRadiusKm ?? 5,
    },
  });
  return toRow(created);
}

/** Ownership-scoped — the caller (application layer) already verified `partnerId` belongs to the
 * authenticated Partner before calling this, but every write here is additionally guarded by a
 * `WHERE partnerId = ...` so a stray/forged id can never update another Partner's listing even if
 * that check were ever skipped upstream. Returns `null` if no row matched (wrong id or wrong owner
 * — the caller treats both as "not found", never leaking which one it was). */
export async function updateOwnListing(
  id: string,
  partnerId: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    price: number;
    imageUrls: string[];
    latitude: number | null;
    longitude: number | null;
    serviceRadiusKm: number;
    isActive: boolean;
  }>,
): Promise<MechanicListingRow | null> {
  const result = await prisma.mechanicListing.updateMany({ where: { id, partnerId }, data });
  if (result.count === 0) return null;
  const row = await prisma.mechanicListing.findUnique({ where: { id } });
  return row ? toRow(row) : null;
}

/** Never a real DELETE — `isActive: false` only, so every existing `MechanicServiceRequest`
 * against this listing (and its `quotedPrice` snapshot) stays intact and queryable forever. */
export async function deactivateOwnListing(id: string, partnerId: string): Promise<boolean> {
  const result = await prisma.mechanicListing.updateMany({
    where: { id, partnerId },
    data: { isActive: false },
  });
  return result.count > 0;
}

export async function findOwnListings(partnerId: string): Promise<MechanicListingRow[]> {
  const rows = await prisma.mechanicListing.findMany({ where: { partnerId }, orderBy: { createdAt: "desc" } });
  return rows.map(toRow);
}

export async function findListingById(id: string): Promise<MechanicListingRow | null> {
  const row = await prisma.mechanicListing.findUnique({ where: { id } });
  return row ? toRow(row) : null;
}

/** Discovery — active listings only, never a deactivated one regardless of filters. */
export async function findNearbyActiveListings(filters: {
  category?: string;
  maxPrice?: number;
}): Promise<MechanicListingRow[]> {
  const rows = await prisma.mechanicListing.findMany({
    where: {
      isActive: true,
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.maxPrice != null ? { price: { lte: filters.maxPrice } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRow);
}
