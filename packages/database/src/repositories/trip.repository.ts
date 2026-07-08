import { prisma } from "../client";
import type { Prisma } from "../generated/prisma/client";

function toSummary(trip: {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  type: string;
  difficulty: string;
  price: Prisma.Decimal;
  seatsTotal: number;
  seatsLeft: number;
  startDate: Date;
  endDate: Date;
  status: string;
  destination: { name: string; slug: string } | null;
}) {
  return {
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    imageUrl: trip.imageUrl,
    type: trip.type,
    difficulty: trip.difficulty,
    price: trip.price.toNumber(),
    seatsTotal: trip.seatsTotal,
    seatsLeft: trip.seatsLeft,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    status: trip.status,
    destination: trip.destination ? { name: trip.destination.name, slug: trip.destination.slug } : null,
  };
}

const TAB_TO_TYPE: Record<string, "WEEKEND" | "ADVENTURE" | "ROAD_TRIP" | "INTERNATIONAL" | "GUIDED_TOUR"> = {
  weekend: "WEEKEND",
  adventure: "ADVENTURE",
  "road-trip": "ROAD_TRIP",
  international: "INTERNATIONAL",
  "guided-tour": "GUIDED_TOUR",
};

export async function findTrips(tab?: string) {
  const where: Prisma.TripWhereInput =
    tab === "completed"
      ? { status: "COMPLETED" }
      : tab && TAB_TO_TYPE[tab]
        ? { type: TAB_TO_TYPE[tab], status: "UPCOMING" }
        : tab === "upcoming" || !tab
          ? { status: "UPCOMING" }
          : {};

  const trips = await prisma.trip.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { destination: true },
  });
  return trips.map(toSummary);
}

export async function findTripBySlug(slug: string) {
  const trip = await prisma.trip.findUnique({
    where: { slug },
    include: { destination: true, organizer: true },
  });
  if (!trip) return null;

  return {
    ...toSummary(trip),
    description: trip.description,
    gallery: trip.gallery,
    organizer: { name: trip.organizer.name, image: trip.organizer.image },
  };
}

export async function findTripsOrganizedBy(userId: string) {
  const trips = await prisma.trip.findMany({
    where: { organizerId: userId },
    orderBy: { startDate: "asc" },
    include: { destination: true },
  });
  return trips.map(toSummary);
}

export async function findTripsJoinedBy(userId: string) {
  const participants = await prisma.tripParticipant.findMany({
    where: { userId, status: "JOINED" },
    include: { trip: { include: { destination: true } } },
    orderBy: { joinedAt: "desc" },
  });
  return participants.map((p) => toSummary(p.trip));
}
