import { prisma } from "../client";
import { countBookingsByStatus, sumCompletedBookingRevenue } from "./booking.repository";

function toDTO(partner: {
  id: string;
  businessName: string;
  type: string;
  city: string;
  description: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  ratingAvg: { toNumber(): number };
  ratingCount: number;
  aadhaarNumber: string | null;
  contactPerson1Name: string | null;
  contactPerson1Mobile: string | null;
  contactPerson2Name: string | null;
  contactPerson2Mobile: string | null;
}) {
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
    aadhaarNumber: partner.aadhaarNumber,
    contactPerson1Name: partner.contactPerson1Name,
    contactPerson1Mobile: partner.contactPerson1Mobile,
    contactPerson2Name: partner.contactPerson2Name,
    contactPerson2Mobile: partner.contactPerson2Mobile,
  };
}

export async function findPartnerByUserId(userId: string) {
  const partner = await prisma.partner.findUnique({ where: { userId } });
  return partner ? toDTO(partner) : null;
}

export async function upsertPartnerProfile(
  userId: string,
  data: {
    businessName: string;
    type: string;
    city: string;
    description?: string;
    aadhaarNumber?: string;
    contactPerson1Name?: string;
    contactPerson1Mobile?: string;
    contactPerson2Name?: string;
    contactPerson2Mobile?: string;
  },
) {
  const shared = {
    businessName: data.businessName,
    type: data.type as any,
    city: data.city,
    description: data.description,
    aadhaarNumber: data.aadhaarNumber,
    contactPerson1Name: data.contactPerson1Name,
    contactPerson1Mobile: data.contactPerson1Mobile,
    contactPerson2Name: data.contactPerson2Name,
    contactPerson2Mobile: data.contactPerson2Mobile,
  };
  const partner = await prisma.partner.upsert({
    where: { userId },
    create: { userId, ...shared },
    update: shared,
  });
  return toDTO(partner);
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
