import { prisma } from "../client";

interface RiderProfileRow {
  drivingLicenceNumber: string | null;
  drivingLicenceExpiry: Date | null;
  addressLine: string | null;
  area: string | null;
  district: string | null;
  pincode: string | null;
  country: string | null;
  fatherName: string | null;
  motherName: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  vehicleType: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleRegistrationNumber: string | null;
  governmentIdType: string | null;
  governmentIdNumber: string | null;
  riderFrequency: string | null;
  ridingClubType: string | null;
  clubName: string | null;
  emergencyContacts: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    relation: string | null;
  }[];
}

function toDTO(profile: RiderProfileRow) {
  return {
    drivingLicenceNumber: profile.drivingLicenceNumber,
    drivingLicenceExpiry: profile.drivingLicenceExpiry?.toISOString() ?? null,
    addressLine: profile.addressLine,
    area: profile.area,
    district: profile.district,
    pincode: profile.pincode,
    country: profile.country,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    medicalHistory: profile.medicalHistory,
    allergies: profile.allergies,
    vehicleType: profile.vehicleType,
    vehicleBrand: profile.vehicleBrand,
    vehicleModel: profile.vehicleModel,
    vehicleRegistrationNumber: profile.vehicleRegistrationNumber,
    governmentIdType: profile.governmentIdType as "AADHAAR" | "PASSPORT" | null,
    governmentIdNumber: profile.governmentIdNumber,
    riderFrequency: profile.riderFrequency as "OCCASIONAL" | "WEEKLY" | "DAILY" | null,
    ridingClubType: profile.ridingClubType as "SOLO" | "CLUB_MEMBER" | null,
    clubName: profile.clubName,
    emergencyContacts: profile.emergencyContacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      relation: c.relation,
    })),
  };
}

/** Null means the user has never been through the onboarding gate (not filled in, not
 * skipped) — distinct from a profile that exists but is empty/skipped. */
export async function findByUserId(userId: string) {
  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
    include: { emergencyContacts: true },
  });
  return profile ? toDTO(profile) : null;
}

export async function hasCompletedOnboardingGate(userId: string): Promise<boolean> {
  const profile = await prisma.riderProfile.findUnique({ where: { userId }, select: { id: true } });
  return profile !== null;
}

/**
 * True only for someone who explicitly skipped onboarding *and* never substantively filled the
 * profile in afterward (e.g. from Settings) — `onboardingSkipped` alone isn't enough, since it's
 * never reset back to false once someone later completes their profile through a normal save.
 * Checked against a handful of representative fields rather than every column; good enough to
 * distinguish "skipped and still empty" from "actually done" without over-specifying what counts.
 */
export async function needsCompletionReminder(userId: string): Promise<boolean> {
  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
    select: {
      onboardingSkipped: true,
      drivingLicenceNumber: true,
      addressLine: true,
      vehicleType: true,
      governmentIdNumber: true,
      emergencyContacts: { select: { id: true }, take: 1 },
    },
  });
  if (!profile || !profile.onboardingSkipped) return false;

  return (
    profile.drivingLicenceNumber === null &&
    profile.addressLine === null &&
    profile.vehicleType === null &&
    profile.governmentIdNumber === null &&
    profile.emergencyContacts.length === 0
  );
}

interface RiderProfileInputData {
  drivingLicenceNumber?: string;
  drivingLicenceExpiry?: string;
  addressLine?: string;
  area?: string;
  district?: string;
  pincode?: string;
  country?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  allergies?: string;
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleRegistrationNumber?: string;
  governmentIdType?: "AADHAAR" | "PASSPORT";
  governmentIdNumber?: string;
  riderFrequency?: "OCCASIONAL" | "WEEKLY" | "DAILY";
  ridingClubType?: "SOLO" | "CLUB_MEMBER";
  clubName?: string;
  emergencyContacts?: { name: string; phone: string; email?: string; relation?: string }[];
}

function sharedFields(data: RiderProfileInputData) {
  return {
    drivingLicenceNumber: data.drivingLicenceNumber,
    drivingLicenceExpiry: data.drivingLicenceExpiry ? new Date(data.drivingLicenceExpiry) : undefined,
    addressLine: data.addressLine,
    area: data.area,
    district: data.district,
    pincode: data.pincode,
    country: data.country,
    fatherName: data.fatherName,
    motherName: data.motherName,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    gender: data.gender,
    bloodGroup: data.bloodGroup,
    medicalHistory: data.medicalHistory,
    allergies: data.allergies,
    vehicleType: data.vehicleType,
    vehicleBrand: data.vehicleBrand,
    vehicleModel: data.vehicleModel,
    vehicleRegistrationNumber: data.vehicleRegistrationNumber,
    governmentIdType: data.governmentIdType,
    governmentIdNumber: data.governmentIdNumber,
    riderFrequency: data.riderFrequency,
    ridingClubType: data.ridingClubType,
    clubName: data.clubName,
  };
}

export async function upsertProfile(userId: string, data: RiderProfileInputData) {
  const profile = await prisma.$transaction(async (tx) => {
    const saved = await tx.riderProfile.upsert({
      where: { userId },
      create: { userId, ...sharedFields(data) },
      update: sharedFields(data),
    });

    if (data.emergencyContacts) {
      await tx.riderEmergencyContact.deleteMany({ where: { riderProfileId: saved.id } });
      if (data.emergencyContacts.length > 0) {
        await tx.riderEmergencyContact.createMany({
          data: data.emergencyContacts.map((c) => ({
            riderProfileId: saved.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            relation: c.relation,
          })),
        });
      }
    }

    return tx.riderProfile.findUniqueOrThrow({
      where: { id: saved.id },
      include: { emergencyContacts: true },
    });
  });

  return toDTO(profile);
}

export async function markOnboardingSkipped(userId: string) {
  await prisma.riderProfile.upsert({
    where: { userId },
    create: { userId, onboardingSkipped: true },
    update: { onboardingSkipped: true },
  });
}
