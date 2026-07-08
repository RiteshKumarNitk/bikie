import { prisma } from "../client";

function toSummary(destination: {
  id: string;
  slug: string;
  name: string;
  state: string;
  imageUrl: string;
  bikeCount: number;
}) {
  return {
    id: destination.id,
    slug: destination.slug,
    name: destination.name,
    state: destination.state,
    imageUrl: destination.imageUrl,
    bikeCount: destination.bikeCount,
  };
}

export async function findPopularDestinations(limit: number) {
  const destinations = await prisma.destination.findMany({
    where: { isPopular: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
  return destinations.map(toSummary);
}

export async function findAllDestinations() {
  const destinations = await prisma.destination.findMany({ orderBy: { name: "asc" } });
  return destinations.map(toSummary);
}

export async function findDestinationBySlug(slug: string) {
  const destination = await prisma.destination.findUnique({
    where: { slug },
    include: {
      bikes: { include: { category: true }, take: 12 },
    },
  });
  if (!destination) return null;

  return {
    ...toSummary(destination),
    description: destination.description,
    bikes: destination.bikes.map((bike) => ({
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
    })),
  };
}
