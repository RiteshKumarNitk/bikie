import { prisma } from "../client";
import { haversineDistanceMeters } from "../lib/geo";
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
  contactPerson1Name: string | null;
  contactPerson1Mobile: string | null;
  contactPerson2Name: string | null;
  contactPerson2Mobile: string | null;
  addressLine: string | null;
  area: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  governmentIdType: string | null;
  governmentIdNumber: string | null;
  isAvailable: boolean;
  isGeneralResponder: boolean;
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
    contactPerson1Name: partner.contactPerson1Name,
    contactPerson1Mobile: partner.contactPerson1Mobile,
    contactPerson2Name: partner.contactPerson2Name,
    contactPerson2Mobile: partner.contactPerson2Mobile,
    addressLine: partner.addressLine,
    area: partner.area,
    pincode: partner.pincode,
    latitude: partner.latitude,
    longitude: partner.longitude,
    governmentIdType: partner.governmentIdType as "AADHAAR" | "PASSPORT" | null,
    governmentIdNumber: partner.governmentIdNumber,
    isAvailable: partner.isAvailable,
    isGeneralResponder: partner.isGeneralResponder,
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
    contactPerson1Name?: string;
    contactPerson1Mobile?: string;
    contactPerson2Name?: string;
    contactPerson2Mobile?: string;
    addressLine?: string;
    area?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    governmentIdType?: string;
    governmentIdNumber?: string;
    isGeneralResponder?: boolean;
  },
) {
  const shared = {
    businessName: data.businessName,
    type: data.type as any,
    city: data.city,
    description: data.description,
    contactPerson1Name: data.contactPerson1Name,
    contactPerson1Mobile: data.contactPerson1Mobile,
    contactPerson2Name: data.contactPerson2Name,
    contactPerson2Mobile: data.contactPerson2Mobile,
    addressLine: data.addressLine,
    area: data.area,
    pincode: data.pincode,
    latitude: data.latitude,
    longitude: data.longitude,
    governmentIdType: data.governmentIdType as any,
    governmentIdNumber: data.governmentIdNumber,
    isGeneralResponder: data.isGeneralResponder,
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

/**
 * Same-city partners for SOS fan-out — includes contact-person mobiles. `type`/`verifiedOnly`
 * (ADR-033) finally give the general emergency-provider blast a way to target just, say,
 * MECHANIC partners for a breakdown instead of every partner type in the city.
 */
export async function findPartnersByCityForDispatch(
  city: string,
  take = 25,
  options: { type?: string; verifiedOnly?: boolean } = {},
) {
  return prisma.partner.findMany({
    where: {
      city: { equals: city.trim(), mode: "insensitive" },
      ...(options.type ? { type: options.type as any } : {}),
      ...(options.verifiedOnly ? { isVerified: true } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    take,
  });
}

/**
 * Public "find a service provider near me" (ADR-036) — plain in-app Haversine over verified
 * partners with a set map pin, not PostGIS. Partner volume is small enough (unlike the
 * high-write `rider_location` table, which does use PostGIS via `ST_DWithin`) that fetching
 * every geotagged partner and filtering/sorting in JS is simpler and fine for v1; revisit only
 * if partner counts grow enough to matter.
 */
export async function findPartnersNearPoint(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  options: { type?: string; take?: number } = {},
) {
  const partners = await prisma.partner.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      isVerified: true,
      ...(options.type ? { type: options.type as any } : {}),
    },
    select: { id: true, businessName: true, type: true, city: true, latitude: true, longitude: true },
  });

  return partners
    .filter((p): p is typeof p & { latitude: number; longitude: number } => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      id: p.id,
      businessName: p.businessName,
      type: p.type,
      city: p.city,
      latitude: p.latitude,
      longitude: p.longitude,
      distanceMeters: haversineDistanceMeters(latitude, longitude, p.latitude, p.longitude),
    }))
    .filter((p) => p.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, options.take ?? 25);
}

export async function setAvailability(userId: string, isAvailable: boolean) {
  const partner = await prisma.partner.update({ where: { userId }, data: { isAvailable } });
  return { isAvailable: partner.isAvailable };
}

/** Thin select for `offerHelp`'s eligibility gate and the nearby-requests filter (ADR-044) —
 * not the full `toDTO` shape, just what those two callers actually need. */
export async function findPartnerEligibilityFields(userId: string) {
  const partner = await prisma.partner.findUnique({
    where: { userId },
    select: { isVerified: true, isAvailable: true, isGeneralResponder: true, type: true },
  });
  return partner;
}

/**
 * Real SOS-dispatch eligibility (ADR-044) — verified, available, geotagged partners within a
 * radius, same plain-Haversine shape as `findPartnersNearPoint` (reused, not reinvented) but
 * returning the fuller `PartnerDispatchRow`-compatible shape dispatch/offer-gating needs
 * (contact-person fields, `user`, `isGeneralResponder`). Type/general-responder *matching*
 * against a specific alert happens one layer up (`partnerMatchesAlertType`) — this stays a
 * plain geo+status query, same separation `findPartnersNearPoint` already has from its callers.
 */
export async function findEligiblePartnersNearPoint(latitude: number, longitude: number, radiusMeters: number) {
  const partners = await prisma.partner.findMany({
    where: { latitude: { not: null }, longitude: { not: null }, isVerified: true, isAvailable: true },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  return partners
    .filter((p): p is typeof p & { latitude: number; longitude: number } => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      userId: p.userId,
      businessName: p.businessName,
      type: p.type,
      isGeneralResponder: p.isGeneralResponder,
      contactPerson1Name: p.contactPerson1Name,
      contactPerson1Mobile: p.contactPerson1Mobile,
      contactPerson2Name: p.contactPerson2Name,
      contactPerson2Mobile: p.contactPerson2Mobile,
      latitude: p.latitude,
      longitude: p.longitude,
      user: p.user,
      distanceMeters: haversineDistanceMeters(latitude, longitude, p.latitude, p.longitude),
    }))
    .filter((p) => p.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
