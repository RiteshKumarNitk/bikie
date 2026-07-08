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
