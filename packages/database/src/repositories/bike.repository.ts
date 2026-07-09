import { prisma } from "../client";
import type { Prisma } from "../generated/prisma/client";

function toSummary(bike: {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: { name: string; slug: string };
  pricePerDay: Prisma.Decimal;
  city: string;
  imageUrl: string;
  ratingAvg: Prisma.Decimal;
  ratingCount: number;
  instantBooking: boolean;
}) {
  return {
    id: bike.id,
    slug: bike.slug,
    name: bike.name,
    brand: bike.brand,
    category: { name: bike.category.name, slug: bike.category.slug },
    pricePerDay: bike.pricePerDay.toNumber(),
    city: bike.city,
    imageUrl: bike.imageUrl,
    ratingAvg: bike.ratingAvg.toNumber(),
    ratingCount: bike.ratingCount,
    instantBooking: bike.instantBooking,
  };
}

export async function findFeaturedBikes(limit: number) {
  const bikes = await prisma.bike.findMany({
    where: { isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  return bikes.map(toSummary);
}

export interface BikeSearchFilters {
  location?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  instantBooking?: boolean;
  sort?: "price_asc" | "price_desc" | "rating";
  page: number;
  pageSize: number;
}

export async function searchBikes(filters: BikeSearchFilters) {
  const where: Prisma.BikeWhereInput = {
    ...(filters.location && {
      OR: [
        { city: { contains: filters.location, mode: "insensitive" } },
        { destination: { name: { contains: filters.location, mode: "insensitive" } } },
      ],
    }),
    ...(filters.category && { category: { slug: filters.category } }),
    ...(filters.brand && { brand: { equals: filters.brand, mode: "insensitive" } }),
    ...(filters.instantBooking !== undefined && { instantBooking: filters.instantBooking }),
    ...((filters.priceMin !== undefined || filters.priceMax !== undefined) && {
      pricePerDay: {
        ...(filters.priceMin !== undefined && { gte: filters.priceMin }),
        ...(filters.priceMax !== undefined && { lte: filters.priceMax }),
      },
    }),
  };

  const orderBy: Prisma.BikeOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { pricePerDay: "asc" }
      : filters.sort === "price_desc"
        ? { pricePerDay: "desc" }
        : filters.sort === "rating"
          ? { ratingAvg: "desc" }
          : { createdAt: "desc" };

  const [bikes, total] = await Promise.all([
    prisma.bike.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { category: true },
    }),
    prisma.bike.count({ where }),
  ]);

  return { bikes: bikes.map(toSummary), total };
}

export async function findBikeBySlug(slug: string) {
  const bike = await prisma.bike.findUnique({
    where: { slug },
    include: { category: true, destination: true },
  });
  if (!bike) return null;

  return {
    ...toSummary(bike),
    gallery: bike.gallery,
    description: bike.description,
    securityDeposit: bike.securityDeposit.toNumber(),
    engineCc: bike.engineCc,
    mileageKmpl: bike.mileageKmpl,
    fuelTankLitres: bike.fuelTankLitres,
    hasAbs: bike.hasAbs,
    seatHeightMm: bike.seatHeightMm,
    luggageCapacityL: bike.luggageCapacityL,
    helmetIncluded: bike.helmetIncluded,
    deliveryAvailable: bike.deliveryAvailable,
    destination: bike.destination ? { name: bike.destination.name, slug: bike.destination.slug } : null,
  };
}

export async function findBikeForBooking(id: string) {
  const bike = await prisma.bike.findUnique({
    where: { id },
    select: { id: true, pricePerDay: true, instantBooking: true },
  });
  if (!bike) return null;
  return {
    id: bike.id,
    pricePerDay: bike.pricePerDay.toNumber(),
    instantBooking: bike.instantBooking,
  };
}

export async function findBikesByOwner(ownerId: string) {
  const bikes = await prisma.bike.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  return bikes.map(toSummary);
}

export async function countBikes() {
  return prisma.bike.count();
}
