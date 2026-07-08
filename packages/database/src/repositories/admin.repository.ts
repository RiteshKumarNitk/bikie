import { prisma } from "../client";
import { sumCompletedBookingRevenue } from "./booking.repository";

export async function getAdminOverviewStats() {
  const [totalUsers, totalPartners, totalBikes, totalBookings, totalTrips, revenueTotal] = await Promise.all([
    prisma.user.count(),
    prisma.partner.count(),
    prisma.bike.count(),
    prisma.booking.count(),
    prisma.trip.count(),
    sumCompletedBookingRevenue(),
  ]);

  return { totalUsers, totalPartners, totalBikes, totalBookings, totalTrips, revenueTotal };
}

export async function findAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
  });
  return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
}

export async function findAllPartners() {
  const partners = await prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return partners.map((p) => ({
    id: p.id,
    businessName: p.businessName,
    type: p.type,
    city: p.city,
    isVerified: p.isVerified,
    ratingAvg: p.ratingAvg.toNumber(),
    ratingCount: p.ratingCount,
    owner: { name: p.user.name, email: p.user.email },
  }));
}

export async function findAllBookingsAdmin() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { bike: true, user: true },
  });
  return bookings.map((b) => ({
    id: b.id,
    status: b.status,
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    totalPrice: b.totalPrice.toNumber(),
    bike: { name: b.bike.name, slug: b.bike.slug },
    renter: { name: b.user.name, email: b.user.email },
  }));
}
