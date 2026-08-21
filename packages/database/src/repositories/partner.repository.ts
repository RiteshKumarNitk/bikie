import { prisma } from "../client";
import { haversineDistanceMeters } from "../lib/geo";
import { countBookingsByStatus, sumCompletedBookingRevenue } from "./booking.repository";

export function toPartnerDTO(partner: {
  id: string;
  businessName: string;
  type: string;
  city: string;
  description: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  ratingAvg: { toNumber(): number };
  ratingCount: number;
  businessMobile: string | null;
  businessEmail: string | null;
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
  workingHours: string | null;
  serviceRadiusKm: number | null;
  yearsOfExperience: number | null;
  isAvailable: boolean;
  isGeneralResponder: boolean;
  verificationStatus: string;
  rejectionReason: string | null;
  reviewNote: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  profilePhotoUrl: string | null;
  shopPhotoUrls: string[];
  identityDocumentUrl: string | null;
  businessDocumentUrl: string | null;
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
    businessMobile: partner.businessMobile,
    businessEmail: partner.businessEmail,
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
    workingHours: partner.workingHours,
    serviceRadiusKm: partner.serviceRadiusKm,
    yearsOfExperience: partner.yearsOfExperience,
    isAvailable: partner.isAvailable,
    isGeneralResponder: partner.isGeneralResponder,
    verificationStatus: partner.verificationStatus as
      | "DRAFT"
      | "PENDING_VERIFICATION"
      | "MORE_INFORMATION_REQUIRED"
      | "APPROVED"
      | "REJECTED"
      | "SUSPENDED",
    rejectionReason: partner.rejectionReason,
    reviewNote: partner.reviewNote,
    submittedAt: partner.submittedAt?.toISOString() ?? null,
    reviewedAt: partner.reviewedAt?.toISOString() ?? null,
    profilePhotoUrl: partner.profilePhotoUrl,
    shopPhotoUrls: partner.shopPhotoUrls,
    identityDocumentUrl: partner.identityDocumentUrl,
    businessDocumentUrl: partner.businessDocumentUrl,
  };
}

export async function findPartnerByUserId(userId: string) {
  const partner = await prisma.partner.findUnique({ where: { userId } });
  return partner ? toPartnerDTO(partner) : null;
}

export type PartnerProfileWriteInput = {
  businessName: string;
  type: string;
  city: string;
  businessMobile: string;
  businessEmail: string;
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
  workingHours?: string;
  serviceRadiusKm?: number;
  yearsOfExperience?: number;
  isGeneralResponder?: boolean;
  profilePhotoUrl?: string;
  shopPhotoUrls?: string[];
  identityDocumentUrl?: string;
  businessDocumentUrl?: string;
};

// Deliberately never touches verificationStatus/isVerified/reviewedAt/etc. — a brand-new row
// gets `verifissssssssssscationStatus: DRAFT` from the schema default; an existing row's status is only
// ever advanced by submitPartnerApplication/reapplyPartner (self-service) or
// adminRepository.transitionPartnerVerification (admin), never by a profile-field edit.
function toUpsertData(data: PartnerProfileWriteInput) {
  return {
    businessName: data.businessName,
    type: data.type as any,
    city: data.city,
    businessMobile: data.businessMobile,
    businessEmail: data.businessEmail,
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
    workingHours: data.workingHours,
    serviceRadiusKm: data.serviceRadiusKm,
    yearsOfExperience: data.yearsOfExperience,
    isGeneralResponder: data.isGeneralResponder,
    profilePhotoUrl: data.profilePhotoUrl,
    ...(data.shopPhotoUrls ? { shopPhotoUrls: data.shopPhotoUrls } : {}),
    identityDocumentUrl: data.identityDocumentUrl,
    businessDocumentUrl: data.businessDocumentUrl,
  };
}

export async function upsertPartnerProfile(userId: string, data: PartnerProfileWriteInput) {
  const shared = toUpsertData(data);
  const partner = await prisma.partner.upsert({
    where: { userId },
    create: { userId, ...shared },
    update: shared,
  });
  return toPartnerDTO(partner);
}

export type PartnerProfileWriteResult =
  | { ok: true; partner: ReturnType<typeof toPartnerDTO> }
  | { ok: false; reason: "NOT_EDITABLE"; status: string };

/** Guarded write for the self-service profile form (`PUT /api/partner/profile`) — only a
 * `SUSPENDED` partner is blocked from editing. Previously also blocked `PENDING_VERIFICATION`
 * and `APPROVED` (an `EDITABLE_STATUSES` allowlist of only DRAFT/MORE_INFORMATION_REQUIRED/
 * REJECTED) — a leftover from the pre-ADR-049 admin-approval model, never updated once ADR-049/050
 * established that verification status is a trust badge, never a permission-to-operate gate, and
 * ADR-050 explicitly removed admin approval from between "profile exists" and "provider operates"
 * entirely. In practice this meant any partner whose application had ever been approved (i.e.
 * every provider actually operating) could never again fix a wrong address or change their
 * service radius — exactly backwards, since those are the fields a provider most needs to update
 * *after* they're already live, not before. `SUSPENDED` alone stays blocked, mirroring
 * `evaluatePartnerCapability` (ADR-049): it's the one deliberate admin trust/safety action that
 * revokes capability too, not just the verification badge. A brand-new applicant (no row yet)
 * always passes — `findUnique` returns `null`, and creating the row also seeds `User.partnerStatus`
 * to DRAFT so a session read reflects "has started an application" from the very first save. */
export async function upsertPartnerProfileIfEditable(
  userId: string,
  data: Parameters<typeof upsertPartnerProfile>[1],
): Promise<PartnerProfileWriteResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.partner.findUnique({ where: { userId }, select: { verificationStatus: true } });
    if (existing && existing.verificationStatus === "SUSPENDED") {
      return { ok: false, reason: "NOT_EDITABLE", status: existing.verificationStatus };
    }
    const shared = toUpsertData(data);
    const partner = await tx.partner.upsert({
      where: { userId },
      create: { userId, ...shared },
      update: shared,
    });
    if (!existing) {
      await tx.user.update({ where: { id: userId }, data: { partnerStatus: "DRAFT" } });
    }
    return { ok: true, partner: toPartnerDTO(partner) };
  });
}

export type SubmitApplicationResult =
  | { ok: true; partner: ReturnType<typeof toPartnerDTO> }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" | "INCOMPLETE"; status?: string };

/** DRAFT | MORE_INFORMATION_REQUIRED -> PENDING_VERIFICATION. */
export async function submitPartnerApplication(userId: string): Promise<SubmitApplicationResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.partner.findUnique({ where: { userId } });
    if (!existing) return { ok: false, reason: "NOT_FOUND" };
    if (existing.verificationStatus !== "DRAFT" && existing.verificationStatus !== "MORE_INFORMATION_REQUIRED") {
      return { ok: false, reason: "INVALID_TRANSITION", status: existing.verificationStatus };
    }
    if (!existing.businessName || !existing.type || !existing.city) {
      return { ok: false, reason: "INCOMPLETE" };
    }
    const partner = await tx.partner.update({
      where: { userId },
      data: { verificationStatus: "PENDING_VERIFICATION", submittedAt: new Date(), reviewNote: null },
    });
    await tx.user.update({ where: { id: userId }, data: { partnerStatus: "PENDING_VERIFICATION" } });
    return { ok: true, partner: toPartnerDTO(partner) };
  });
}

export type ReapplyResult =
  | { ok: true; partner: ReturnType<typeof toPartnerDTO> }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" };

/** REJECTED -> DRAFT, clearing the rejection reason/review timestamps but keeping every
 * previously-entered field as an editable starting point. */
export async function reapplyPartner(userId: string): Promise<ReapplyResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.partner.findUnique({ where: { userId } });
    if (!existing) return { ok: false, reason: "NOT_FOUND" };
    if (existing.verificationStatus !== "REJECTED") return { ok: false, reason: "INVALID_TRANSITION" };
    const partner = await tx.partner.update({
      where: { userId },
      data: { verificationStatus: "DRAFT", rejectionReason: null, reviewNote: null, reviewedAt: null, reviewedByUserId: null },
    });
    await tx.user.update({ where: { id: userId }, data: { partnerStatus: "DRAFT" } });
    return { ok: true, partner: toPartnerDTO(partner) };
  });
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
 * Public "find a service provider near me" (ADR-036) — plain in-app Haversine over partners
 * with a set map pin, not PostGIS. Partner volume is small enough (unlike the high-write
 * `rider_location` table, which does use PostGIS via `ST_DWithin`) that fetching every
 * geotagged partner and filtering/sorting in JS is simpler and fine for v1; revisit only if
 * partner counts grow enough to matter.
 *
 * §9/§12 of the master product spec — shows EVERY registered partner (verified and unverified
 * alike) so riders can see the trust difference for themselves; only admin-SUSPENDED partners
 * (capability revoked by a deliberate trust/safety action) are excluded. The rows carry
 * `verificationStatus`/`ratingAvg`/`ratingCount`/`isAvailable` so every card can render the
 * "✓ BIKIE VERIFIED" / "⚠ Unverified Provider" badge, rating, and live availability the spec
 * requires — the old `isVerified: true` filter hid unverified providers entirely.
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
      verificationStatus: { not: "SUSPENDED" },
      ...(options.type ? { type: options.type as any } : {}),
    },
    select: {
      id: true,
      businessName: true,
      type: true,
      city: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
      isAvailable: true,
      ratingAvg: true,
      ratingCount: true,
    },
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
      verificationStatus: p.verificationStatus,
      isAvailable: p.isAvailable,
      ratingAvg: p.ratingAvg.toNumber(),
      ratingCount: p.ratingCount,
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
 * not the full `toDTO` shape, just what those callers actually need. `id` is included so the
 * session-rating path can decide "does this helper have a Service Provider profile at all" and,
 * if so, attach a §25 service review to exactly that provider. `verificationStatus` (not the
 * derived `isVerified` boolean) is what the gate reads now — the FINAL PRODUCT MODEL makes
 * capability a function of "profile exists and isn't SUSPENDED", with verification only a
 * separate trust badge, so unverified-but-active providers must be able to accept assistance
 * requests too. */
export async function findPartnerEligibilityFields(userId: string) {
  const partner = await prisma.partner.findUnique({
    where: { userId },
    select: { id: true, verificationStatus: true, isAvailable: true, isGeneralResponder: true, type: true },
  });
  return partner;
}

// --- §25: Rider → Service Provider service reviews ---

/** Insert one review and fold it into the partner's running `ratingAvg`/`ratingCount` atomically
 * (the same aggregate the discovery cards and dashboard read). Returns false when a review for
 * this SOS session already exists — the application layer already prevents double-rating via
 * `SOSSession.rating`, this is just belt-and-suspenders on the `sessionId` unique index. */
export async function addProviderReview(params: {
  providerId: string;
  riderId: string;
  sessionId: string;
  rating: number;
  comment?: string;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.providerReview.findUnique({ where: { sessionId: params.sessionId } });
    if (existing) return false;

    const partner = await tx.partner.findUniqueOrThrow({ where: { id: params.providerId } });
    const nextCount = partner.ratingCount + 1;
    // Weighted running average — `avg * count` loses nothing meaningful at these scales and
    // avoids a second aggregate query inside the transaction.
    const nextAvg = (Number(partner.ratingAvg) * partner.ratingCount + params.rating) / nextCount;

    await tx.providerReview.create({
      data: {
        providerId: params.providerId,
        riderId: params.riderId,
        sessionId: params.sessionId,
        rating: params.rating,
        comment: params.comment ?? null,
      },
    });
    await tx.partner.update({
      where: { id: params.providerId },
      data: { ratingCount: nextCount, ratingAvg: nextAvg },
    });
    return true;
  });
}

/** A provider's own service reviews, newest first, with the rider's name for display. */
export async function findProviderReviews(providerId: string, take = 50) {
  return prisma.providerReview.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    take,
    include: { rider: { select: { id: true, name: true } } },
  });
}

/**
 * Real SOS-dispatch eligibility (ADR-044, amended by the FINAL PRODUCT MODEL) — any active
 * (non-SUSPENDED), available, geotagged partner within a radius is eligible to be dispatched,
 * same plain-Haversine shape as `findPartnersNearPoint` (reused, not reinvented) but returning
 * the fuller `PartnerDispatchRow`-compatible shape dispatch/offer-gating needs (contact-person
 * fields, `user`, `isGeneralResponder`). Verification is deliberately NOT a dispatch gate:
 * unverified providers operate the platform and can accept assistance requests — verification
 * is a separate trust badge, not permission to exist. Type/general-responder *matching* against
 * a specific alert happens one layer up (`partnerMatchesAlertType`) — this stays a plain
 * geo+status query, same separation `findPartnersNearPoint` already has from its callers.
 */
/** ADR-056 — a partner without an active `PartnerMembership` (`endDate >= now`, `status: ACTIVE`)
 * must never be dispatched an SOS alert at all, not just blocked from accepting one: getting
 * paged/SMS'd about an emergency they're not entitled to respond to is itself the wrong
 * experience, and it's also what `offerHelp`'s membership re-check (session.application.ts)
 * exists to catch if this filter is ever somehow bypassed. */
export async function findEligiblePartnersNearPoint(latitude: number, longitude: number, radiusMeters: number) {
  const partners = await prisma.partner.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      verificationStatus: { not: "SUSPENDED" },
      isAvailable: true,
      user: { partnerMembership: { some: { status: "ACTIVE", endDate: { gte: new Date() } } } },
    },
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
