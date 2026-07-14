import { prisma } from "../client";

function toDTO(booking: {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalPrice: { toNumber: () => number };
  pickupCity: string;
  createdAt: Date;
  bike: { slug: string; name: string; imageUrl: string; brand: string };
  review: { id: string } | null;
}) {
  return {
    id: booking.id,
    status: booking.status,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    totalPrice: booking.totalPrice.toNumber(),
    pickupCity: booking.pickupCity,
    createdAt: booking.createdAt.toISOString(),
    bike: booking.bike,
    hasReview: Boolean(booking.review),
  };
}

/**
 * Creates a booking only if the bike has no overlapping non-cancelled booking for the
 * requested date range. Locks the Bike row for the duration of the transaction so two
 * concurrent requests for the same bike are serialized instead of racing past the
 * overlap check together. Returns null (no booking created) if the bike is unavailable.
 */
export async function createBookingIfAvailable(data: {
  userId: string;
  bikeId: string;
  startDate: Date;
  endDate: Date;
  pickupCity: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED";
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Bike" WHERE id = ${data.bikeId} FOR UPDATE`;

    const overlapping = await tx.booking.findFirst({
      where: {
        bikeId: data.bikeId,
        status: { not: "CANCELLED" },
        startDate: { lt: data.endDate },
        endDate: { gt: data.startDate },
      },
      select: { id: true },
    });
    if (overlapping) return null;

    const booking = await tx.booking.create({
      data: {
        userId: data.userId,
        bikeId: data.bikeId,
        startDate: data.startDate,
        endDate: data.endDate,
        pickupCity: data.pickupCity,
        totalPrice: data.totalPrice,
        status: data.status,
      },
      include: { bike: true, review: true },
    });
    return toDTO(booking);
  });
}

export async function findBookingById(id: string) {
  return prisma.booking.findUnique({ where: { id } });
}

export async function findBookingsByUser(userId: string, status?: string) {
  const bookings = await prisma.booking.findMany({
    where: { userId, ...(status && { status: status as never }) },
    orderBy: { startDate: "desc" },
    include: { bike: true, review: true },
  });
  return bookings.map(toDTO);
}

export async function findBookingsForPartnerBikes(ownerId: string) {
  const bookings = await prisma.booking.findMany({
    where: { bike: { ownerId } },
    orderBy: { startDate: "desc" },
    include: { bike: true, review: true },
  });
  return bookings.map(toDTO);
}

export async function countBookings() {
  return prisma.booking.count();
}

export async function sumCompletedBookingRevenue(ownerId?: string) {
  const result = await prisma.booking.aggregate({
    where: { status: "COMPLETED", ...(ownerId && { bike: { ownerId } }) },
    _sum: { totalPrice: true },
  });
  return result._sum.totalPrice?.toNumber() ?? 0;
}

export async function countBookingsByStatus(ownerId: string, status: "ACTIVE" | "CONFIRMED" | "COMPLETED") {
  return prisma.booking.count({ where: { bike: { ownerId }, status } });
}
