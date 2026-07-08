import { prisma } from "../client";
import { countBookingsByStatus, sumCompletedBookingRevenue } from "./booking.repository";

export async function findPartnerByUserId(userId: string) {
  const partner = await prisma.partner.findUnique({ where: { userId } });
  if (!partner) return null;

  return {
    id: partner.id,
    businessName: partner.businessName,
    type: partner.type,
    city: partner.city,
    description: partner.description,
    logoUrl: partner.logoUrl,
    isVerified: partner.isVerified,
    ratingAvg: partner.ratingAvg.toNumber(),
    ratingCount: partner.ratingCount,
  };
}

export async function upsertPartnerProfile(
  userId: string,
  data: { businessName: string; type: string; city: string; description?: string },
) {
  const partner = await prisma.partner.upsert({
    where: { userId },
    create: {
      userId,
      businessName: data.businessName,
      type: data.type as any,
      city: data.city,
      description: data.description,
    },
    update: {
      businessName: data.businessName,
      type: data.type as any,
      city: data.city,
      description: data.description,
    },
  });
  return {
    id: partner.id,
    businessName: partner.businessName,
    type: partner.type,
    city: partner.city,
    description: partner.description,
    logoUrl: partner.logoUrl,
    isVerified: partner.isVerified,
    ratingAvg: partner.ratingAvg.toNumber(),
    ratingCount: partner.ratingCount,
  };
}

export async function getPartnerDashboardStats(userId: string) {
  const [totalBikes, activeBookings, completedBookings, totalEarnings, partner] = await Promise.all([
    prisma.bike.count({ where: { ownerId: userId } }),
    countBookingsByStatus(userId, "CONFIRMED"),
    countBookingsByStatus(userId, "COMPLETED"),
    sumCompletedBookingRevenue(userId),
    prisma.partner.findUnique({ where: { userId } }),
  ]);

  return {
    totalBikes,
    activeBookings,
    completedBookings,
    totalEarnings,
    ratingAvg: partner?.ratingAvg.toNumber() ?? 0,
    ratingCount: partner?.ratingCount ?? 0,
  };
}
