import { prisma } from "../client";
import { Prisma } from "../generated/prisma/client.js";
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

  const bookings = await prisma.booking.findMany({ select: { status: true, createdAt: true, totalPrice: true } });
  const bikes = await prisma.bike.findMany({ select: { city: true } });

  const monthlyMap = new Map<string, { count: number; amount: number }>();
  const statusCount: Record<string, number> = {};
  const cityCount: Record<string, number> = {};

  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 7);
    const cur = monthlyMap.get(key) ?? { count: 0, amount: 0 };
    cur.count++;
    cur.amount += Number(b.totalPrice);
    monthlyMap.set(key, cur);
    statusCount[b.status] = (statusCount[b.status] ?? 0) + 1;
  }

  for (const b of bikes) {
    cityCount[b.city] = (cityCount[b.city] ?? 0) + 1;
  }

  const monthlyBookings = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, count: d.count }));

  const monthlyRevenue = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, amount: d.amount }));

  const bookingsByStatus = Object.entries(statusCount).map(([status, count]) => ({ status, count }));
  const bikesByCity = Object.entries(cityCount).map(([city, count]) => ({ city, count }));

  return { totalUsers, totalPartners, totalBikes, totalBookings, totalTrips, revenueTotal, monthlyBookings, monthlyRevenue, bookingsByStatus, bikesByCity };
}

export async function findAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
  });
  return users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
}

export async function updateUserRole(userId: string, role: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true, createdAt: true, image: true },
  });
  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function deleteUser(userId: string): Promise<{ ok: true } | { ok: false; reason: "HAS_DEPENDENCIES" }> {
  try {
    await prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  } catch (err) {
    // Bookings/reviews/organized trips/moderation actions etc. all restrict deletion of
    // their owning user (see schema.prisma) — surface that as a clean 409 instead of a
    // raw 500 so the admin UI can explain why the delete didn't go through.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return { ok: false, reason: "HAS_DEPENDENCIES" };
    }
    throw err;
  }
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

export async function updatePartnerVerification(partnerId: string, isVerified: boolean) {
  await prisma.partner.update({
    where: { id: partnerId },
    data: { isVerified },
  });
}

export async function deletePartner(partnerId: string) {
  await prisma.partner.delete({ where: { id: partnerId } });
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

export async function updateBookingStatus(bookingId: string, status: string) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: status as any },
  });
}

export async function deleteBooking(bookingId: string) {
  await prisma.booking.delete({ where: { id: bookingId } });
}

export async function createBike(data: {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  city: string;
  pricePerDay: number;
  imageUrl: string;
  ownerId?: string;
  description?: string;
}) {
  const bike = await prisma.bike.create({ data: { ...data } as any });
  return bike;
}

export async function updateBike(
  bikeId: string,
  data: Partial<{
    name: string;
    slug: string;
    brand: string;
    categoryId: string;
    city: string;
    pricePerDay: number;
    imageUrl: string;
    description: string;
  }>,
) {
  const bike = await prisma.bike.update({ where: { id: bikeId }, data: data as any });
  return bike;
}

export async function deleteBike(bikeId: string) {
  await prisma.bike.delete({ where: { id: bikeId } });
}

// --- Testimonials ---

export async function findAllTestimonials() {
  return prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createTestimonial(data: {
  authorName: string;
  authorLocation?: string;
  authorAvatarUrl?: string;
  rating: number;
  quote: string;
}) {
  return prisma.testimonial.create({
    data: {
      authorName: data.authorName,
      authorLocation: data.authorLocation,
      authorAvatarUrl: data.authorAvatarUrl,
      rating: data.rating,
      quote: data.quote,
      isFeatured: true,
    },
  });
}

export async function updateTestimonial(id: string, data: any) {
  return prisma.testimonial.update({ where: { id }, data });
}

export async function deleteTestimonial(id: string) {
  await prisma.testimonial.delete({ where: { id } });
}

// --- Audit Logs ---

export async function findAllAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}

// --- Membership Plans ---

function mapPlan(p: {
  id: string;
  name: string;
  description: string;
  price: { toNumber(): number };
  durationDays: number;
  benefits: string[];
  isActive: boolean;
}) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price.toNumber(),
    durationDays: p.durationDays,
    benefits: p.benefits,
    isActive: p.isActive,
  };
}

export async function findAllPlansAdmin() {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: "asc" } });
  return plans.map(mapPlan);
}

export async function createMembershipPlan(data: {
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  sortOrder?: number;
}) {
  const plan = await prisma.membershipPlan.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      benefits: data.benefits,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return mapPlan(plan);
}

export async function updateMembershipPlan(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    durationDays: number;
    benefits: string[];
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  const plan = await prisma.membershipPlan.update({ where: { id }, data });
  return mapPlan(plan);
}

export async function deleteMembershipPlan(id: string) {
  await prisma.membershipPlan.delete({ where: { id } });
}

// --- Trips ---

function mapTripAdmin(t: {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  price: { toNumber(): number };
  seatsTotal: number;
  seatsLeft: number;
  startDate: Date;
  endDate: Date;
  status: string;
  organizer: { id: string; name: string; email: string };
  createdAt: Date;
}) {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    type: t.type,
    difficulty: t.difficulty,
    price: t.price.toNumber(),
    seatsTotal: t.seatsTotal,
    seatsLeft: t.seatsLeft,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    status: t.status,
    organizer: t.organizer,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function findAllTripsAdmin() {
  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: { organizer: { select: { id: true, name: true, email: true } } },
  });
  return trips.map(mapTripAdmin);
}

export async function updateTripAdmin(
  tripId: string,
  data: Partial<{
    title: string;
    description: string;
    seatsTotal: number;
    startDate: string;
    endDate: string;
    status: string;
  }>,
) {
  const { startDate, endDate, status, ...rest } = data;
  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: { organizer: { select: { id: true, name: true, email: true } } },
  });
  return mapTripAdmin(trip);
}

export async function deleteTripAdmin(tripId: string) {
  await prisma.trip.delete({ where: { id: tripId } });
}

// --- Groups ---

function slugifyGroupName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapGroup(g: {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  city: string | null;
  isPrivate: boolean;
  owner: { id: string; name: string; email: string };
  _count: { members: number };
  createdAt: Date;
}) {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    description: g.description,
    imageUrl: g.imageUrl,
    type: g.type,
    city: g.city,
    isPrivate: g.isPrivate,
    owner: g.owner,
    memberCount: g._count.members,
    createdAt: g.createdAt.toISOString(),
  };
}

const groupAdminInclude = {
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { members: true } },
} as const;

export async function findAllGroupsAdmin() {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
    include: groupAdminInclude,
  });
  return groups.map(mapGroup);
}

export async function createGroupAdmin(data: {
  name: string;
  description: string;
  imageUrl: string;
  type: "COMMUNITY" | "CLUB";
  city?: string;
  isPrivate?: boolean;
  ownerId: string;
}) {
  const baseSlug = slugifyGroupName(data.name) || "group";
  let slug = baseSlug;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const group = await prisma.group.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          imageUrl: data.imageUrl,
          type: data.type,
          city: data.city,
          isPrivate: data.isPrivate ?? false,
          ownerId: data.ownerId,
          members: { create: { userId: data.ownerId, role: "OWNER", status: "APPROVED" } },
        },
        include: groupAdminInclude,
      });
      return mapGroup(group);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && attempt < 4) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate a unique slug for this group");
}

export async function updateGroupAdmin(
  groupId: string,
  data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    type: "COMMUNITY" | "CLUB";
    city: string | null;
    isPrivate: boolean;
    ownerId: string;
  }>,
) {
  const group = await prisma.group.update({
    where: { id: groupId },
    data: data as never,
    include: groupAdminInclude,
  });
  return mapGroup(group);
}

export async function deleteGroupAdmin(groupId: string) {
  await prisma.group.delete({ where: { id: groupId } });
}

export async function findAllReferrals() {
  const referred = await prisma.user.findMany({
    where: { referredById: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      referredBy: { select: { id: true, name: true, email: true } },
    },
  });

  return referred.map((r) => ({
    refereeId: r.id,
    refereeName: r.name,
    refereeEmail: r.email,
    createdAt: r.createdAt.toISOString(),
    referrerId: r.referredBy!.id,
    referrerName: r.referredBy!.name,
    referrerEmail: r.referredBy!.email,
  }));
}
