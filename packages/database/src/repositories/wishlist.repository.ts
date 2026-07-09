import { prisma } from "../client";

export async function addToWishlist(userId: string, bikeId: string) {
  await prisma.wishlist.upsert({
    where: { userId_bikeId: { userId, bikeId } },
    create: { userId, bikeId },
    update: {},
  });
}

export async function removeFromWishlist(userId: string, bikeId: string) {
  await prisma.wishlist.deleteMany({ where: { userId, bikeId } });
}

export async function findWishlistByUser(userId: string) {
  const items = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { bike: { include: { category: true } } },
  });

  return items.map((item) => ({
    id: item.id,
    createdAt: item.createdAt.toISOString(),
    bike: {
      id: item.bike.id,
      slug: item.bike.slug,
      name: item.bike.name,
      brand: item.bike.brand,
      category: { name: item.bike.category.name, slug: item.bike.category.slug },
      pricePerDay: item.bike.pricePerDay.toNumber(),
      city: item.bike.city,
      imageUrl: item.bike.imageUrl,
      ratingAvg: item.bike.ratingAvg.toNumber(),
      ratingCount: item.bike.ratingCount,
      instantBooking: item.bike.instantBooking,
    },
  }));
}
