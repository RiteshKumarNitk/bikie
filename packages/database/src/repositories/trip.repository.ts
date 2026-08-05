import { prisma } from "../client";
import { Prisma as PrismaRuntime } from "../generated/prisma/client.js";
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

export interface TripFilters {
  /** Destination slug */
  destination?: string;
  difficulty?: string;
  /** Inclusive lower bound on startDate */
  from?: Date;
  /** Inclusive upper bound on startDate */
  to?: Date;
}

export async function findTrips(tab?: string, filters?: TripFilters) {
  const where: Prisma.TripWhereInput =
    tab === "completed"
      ? { status: "COMPLETED" }
      : tab && TAB_TO_TYPE[tab]
        ? { type: TAB_TO_TYPE[tab], status: "UPCOMING" }
        : tab === "upcoming" || !tab
          ? { status: "UPCOMING" }
          : {};

  if (filters?.destination) {
    where.destination = { slug: filters.destination };
  }
  if (filters?.difficulty) {
    where.difficulty = filters.difficulty as never;
  }
  if (filters?.from || filters?.to) {
    where.startDate = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

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
    include: { 
      destination: true, 
      organizer: true,
      participants: {
        where: { status: "APPROVED" },
        include: { user: true }
      }
    },
  });
  if (!trip) return null;

  return {
    ...toSummary(trip),
    description: trip.description,
    gallery: trip.gallery,
    meetingPoint: trip.meetingPoint,
    organizer: { id: trip.organizer.id, name: trip.organizer.name, image: trip.organizer.image },
    members: trip.participants.map(p => ({
      id: p.user.id,
      name: p.user.name,
      image: p.user.image,
    }))
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
    where: { userId, status: "APPROVED" },
    include: { trip: { include: { destination: true } } },
    orderBy: { joinedAt: "desc" },
  });
  return participants.map((p) => toSummary(p.trip));
}

export async function findTripsRequestedBy(userId: string) {
  const participants = await prisma.tripParticipant.findMany({
    where: { userId, status: "PENDING" },
    include: { trip: { include: { destination: true } } },
    orderBy: { joinedAt: "desc" },
  });
  return participants.map((p) => toSummary(p.trip));
}

export async function findPendingRequestsForOrganizer(organizerId: string) {
  const requests = await prisma.tripParticipant.findMany({
    where: {
      trip: { organizerId },
      status: "PENDING"
    },
    include: {
      trip: { select: { id: true, slug: true, title: true } },
      user: { select: { id: true, name: true, image: true, bikes: { take: 1, select: { name: true } } } }
    },
    orderBy: { joinedAt: "desc" }
  });
  
  return requests.map((r) => ({
    id: r.id,
    message: r.message,
    createdAt: r.joinedAt.toISOString(),
    rider: { 
      id: r.user.id, 
      name: r.user.name, 
      image: r.user.image,
      bike: r.user.bikes?.[0]?.name 
    },
    tripId: r.trip.id,
    tripSlug: r.trip.slug,
    tripTitle: r.trip.title,
  }));
}

export async function getOrganizerDashboardMetrics(organizerId: string) {
  const [pendingRequests, upcomingRides] = await Promise.all([
    prisma.tripParticipant.count({
      where: { trip: { organizerId }, status: "PENDING" }
    }),
    prisma.trip.count({
      where: {
        OR: [
          { organizerId, status: "UPCOMING" },
          { participants: { some: { userId: organizerId, status: "APPROVED" } }, status: "UPCOMING" }
        ]
      }
    })
  ]);

  return { pendingRequests, upcomingRides };
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createTrip(data: {
  title: string;
  description: string;
  imageUrl: string;
  type: string;
  difficulty: string;
  price: number;
  seatsTotal: number;
  meetingPoint?: string;
  startDate: Date;
  endDate: Date;
  organizerId: string;
  destinationId?: string;
}) {
  const base = slugify(data.title);

  // Retry-on-conflict instead of check-then-create: two concurrent creates with the
  // same title can both pass a "does this slug exist" check before either commits, so
  // the uniqueness has to be enforced by letting the DB's unique constraint reject the
  // collision and trying the next suffix.
  for (let suffix = 0; ; suffix += 1) {
    const slug = suffix === 0 ? base : `${base}-${suffix}`;
    try {
      const trip = await prisma.trip.create({
        data: {
          slug,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          type: data.type as never,
          difficulty: data.difficulty as never,
          price: data.price,
          seatsTotal: data.seatsTotal,
          seatsLeft: data.seatsTotal,
          meetingPoint: data.meetingPoint,
          startDate: data.startDate,
          endDate: data.endDate,
          organizerId: data.organizerId,
          destinationId: data.destinationId,
        },
        include: { destination: true },
      });
      return toSummary(trip);
    } catch (err) {
      if (err instanceof PrismaRuntime.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }
}

export async function findTripById(id: string) {
  return prisma.trip.findUnique({ where: { id } });
}

export async function updateTrip(slug: string, data: Partial<Omit<Prisma.TripUncheckedUpdateInput, "slug">>) {
  const trip = await prisma.trip.update({
    where: { slug },
    data,
    include: { destination: true },
  });
  return toSummary(trip);
}

export async function getRoomInfo(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: { meetingPoint: true, meetingLat: true, meetingLng: true, emergencyContacts: true },
  });
}

export async function updateMeetingPoint(
  tripId: string,
  data: { meetingPoint?: string; meetingLat?: number; meetingLng?: number },
) {
  return prisma.trip.update({ where: { id: tripId }, data });
}

export async function updateEmergencyContacts(
  tripId: string,
  contacts: { name: string; phone: string; relation: string }[],
) {
  return prisma.trip.update({ where: { id: tripId }, data: { emergencyContacts: contacts } });
}

export async function findParticipant(tripId: string, userId: string) {
  return prisma.tripParticipant.findUnique({ where: { tripId_userId: { tripId, userId } } });
}

export async function findParticipantById(participantId: string) {
  return prisma.tripParticipant.findUnique({
    where: { id: participantId },
    include: { trip: { include: { organizer: true } }, user: true },
  });
}

export async function upsertJoinRequest(tripId: string, userId: string, message?: string) {
  return prisma.tripParticipant.upsert({
    where: { tripId_userId: { tripId, userId } },
    create: { tripId, userId, message, status: "PENDING" },
    update: { message, status: "PENDING", decidedAt: null },
  });
}

export async function findPendingRequestsForTrip(tripId: string) {
  const requests = await prisma.tripParticipant.findMany({
    where: { tripId, status: "PENDING" },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  return requests.map((r) => ({
    id: r.id,
    message: r.message,
    createdAt: r.joinedAt.toISOString(),
    rider: { id: r.user.id, name: r.user.name, image: r.user.image },
  }));
}

export async function decideParticipant(participantId: string, status: "APPROVED" | "REJECTED") {
  return prisma.tripParticipant.update({
    where: { id: participantId },
    data: { status, decidedAt: new Date() },
  });
}

export async function cancelParticipant(participantId: string) {
  return prisma.tripParticipant.update({
    where: { id: participantId },
    data: { status: "CANCELLED", decidedAt: new Date() },
  });
}

/** Atomic conditional decrement — returns false if no seats were available. */
export async function decrementSeatsLeft(tripId: string) {
  const result = await prisma.trip.updateMany({
    where: { id: tripId, seatsLeft: { gt: 0 } },
    data: { seatsLeft: { decrement: 1 } },
  });
  return result.count === 1;
}

/** Only called to reverse a prior decrementSeatsLeft (cancelling an approved
 * participant), so the increment/decrement pair stays balanced without
 * needing a cross-column comparison. */
export async function incrementSeatsLeft(tripId: string) {
  await prisma.trip.update({
    where: { id: tripId },
    data: { seatsLeft: { increment: 1 } },
  });
}

export async function linkConversationToTrip(tripId: string, conversationId: string) {
  await prisma.conversation.update({ where: { id: conversationId }, data: { tripId } });
}

export async function findConversationIdForTrip(tripId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { tripId }, select: { id: true } });
  return conversation?.id ?? null;
}

/**
 * Race-safe "find the ride's group Conversation, or create it" — locks the Trip row for the
 * duration of the transaction so two approvals landing close together (or a double-submitted
 * approve click) can't both see "no conversation yet" and each create one. `Conversation.tripId`
 * being `@unique` meant the loser of that race used to hit an unhandled constraint violation,
 * leaving an orphaned, unlinked "New chat" conversation behind (still visible to the organizer
 * via their regular conversation list, just never wired to the trip) — reproduced live when
 * approvals happened close together. Returns `{ conversationId, created }` so the caller knows
 * whether to also add the newly-approved participant (already included at creation time if
 * `created` is true) or just insert them into the pre-existing conversation.
 */
export async function getOrCreateRideConversation(
  tripId: string,
  organizerId: string,
  participantUserId: string,
  tripTitle: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Trip" WHERE id = ${tripId} FOR UPDATE`;

    const existing = await tx.conversation.findUnique({ where: { tripId }, select: { id: true } });
    if (existing) {
      await tx.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: existing.id, userId: participantUserId } },
        create: { conversationId: existing.id, userId: participantUserId, role: "MEMBER" },
        update: {},
      });
      return { conversationId: existing.id, created: false };
    }

    const conversation = await tx.conversation.create({
      data: {
        subject: `Ride: ${tripTitle}`,
        tripId,
        participants: {
          create: [
            { userId: organizerId, role: "ORGANIZER" },
            { userId: participantUserId, role: "MEMBER" },
          ],
        },
      },
    });
    return { conversationId: conversation.id, created: true };
  });
}

/**
 * Single transaction for ride approval (P0): lock trip → conditional seat decrement →
 * mark participant APPROVED → get-or-create ride conversation. Side effects
 * (system message, push) stay outside so a notification failure cannot roll back seats.
 */
export async function approveParticipantAtomically(participantId: string, organizerId: string) {
  return prisma.$transaction(async (tx) => {
    const participant = await tx.tripParticipant.findUnique({
      where: { id: participantId },
      include: {
        trip: { include: { organizer: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!participant) return { ok: false as const, reason: "NOT_FOUND" as const };
    if (participant.trip.organizerId !== organizerId) {
      return { ok: false as const, reason: "FORBIDDEN" as const };
    }
    if (participant.status !== "PENDING") {
      return { ok: false as const, reason: "ALREADY_DECIDED" as const };
    }

    await tx.$queryRaw`SELECT id FROM "Trip" WHERE id = ${participant.tripId} FOR UPDATE`;

    // Re-check after lock — a concurrent approve may have already consumed this request.
    const fresh = await tx.tripParticipant.findUnique({
      where: { id: participantId },
      select: { status: true },
    });
    if (!fresh || fresh.status !== "PENDING") {
      return { ok: false as const, reason: "ALREADY_DECIDED" as const };
    }

    const seat = await tx.trip.updateMany({
      where: { id: participant.tripId, seatsLeft: { gt: 0 } },
      data: { seatsLeft: { decrement: 1 } },
    });
    if (seat.count !== 1) return { ok: false as const, reason: "NO_SEATS" as const };

    await tx.tripParticipant.update({
      where: { id: participantId },
      data: { status: "APPROVED", decidedAt: new Date() },
    });

    const existing = await tx.conversation.findUnique({
      where: { tripId: participant.tripId },
      select: { id: true },
    });
    let conversationId: string;
    if (existing) {
      await tx.conversationParticipant.upsert({
        where: {
          conversationId_userId: { conversationId: existing.id, userId: participant.userId },
        },
        create: { conversationId: existing.id, userId: participant.userId, role: "MEMBER" },
        update: {},
      });
      conversationId = existing.id;
    } else {
      const conversation = await tx.conversation.create({
        data: {
          subject: `Ride: ${participant.trip.title}`,
          tripId: participant.tripId,
          participants: {
            create: [
              { userId: organizerId, role: "ORGANIZER" },
              { userId: participant.userId, role: "MEMBER" },
            ],
          },
        },
      });
      conversationId = conversation.id;
    }

    return {
      ok: true as const,
      conversationId,
      tripId: participant.tripId,
      tripSlug: participant.trip.slug,
      tripTitle: participant.trip.title,
      organizerName: participant.trip.organizer.name,
      userId: participant.userId,
      userName: participant.user.name,
    };
  });
}

export async function getRideStatsForUser(userId: string) {
  const [ridesOrganized, requestsSent, requestsApproved, ridesCancelled] = await Promise.all([
    prisma.trip.count({ where: { organizerId: userId } }),
    prisma.tripParticipant.count({ where: { userId, status: { not: "PENDING" } } }),
    prisma.tripParticipant.count({ where: { userId, status: "APPROVED" } }),
    prisma.tripParticipant.count({ where: { userId, status: "CANCELLED" } }),
  ]);
  return { ridesOrganized, requestsSent, requestsApproved, ridesCancelled };
}
