import { prisma } from "../client";

export async function findPopularDestinations(limit: number) {
  const destinations = await prisma.destination.findMany({
    where: { isPopular: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  return destinations.map((destination) => ({
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    state: destination.state,
    imageUrl: destination.imageUrl,
    bikeCount: destination.bikeCount,
  }));
}
