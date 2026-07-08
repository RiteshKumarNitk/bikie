import { prisma } from "../client";

export async function findFeaturedBikes(limit: number) {
  const bikes = await prisma.bike.findMany({
    where: { isFeatured: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return bikes.map((bike) => ({
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
  }));
}
