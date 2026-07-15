import { z } from "zod";

const emergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(6).max(20),
  relation: z.string().max(50).optional(),
});

/** Preprocesses empty-string form fields to `undefined` so optional fields don't fail
 * validation just because a form left them blank. */
function optionalDate() {
  return z.preprocess((val) => (val === "" || val == null ? undefined : val), z.string().datetime().optional());
}
function optionalString(max: number) {
  return z.preprocess((val) => (val === "" ? undefined : val), z.string().max(max).optional());
}

export const riderProfileSchema = z.object({
  drivingLicenceNumber: optionalString(30),
  drivingLicenceExpiry: optionalDate(),
  addressLine: optionalString(200),
  area: optionalString(100),
  district: optionalString(100),
  pincode: optionalString(10),
  country: optionalString(56),
  // --- ADR-014 ---
  fatherName: optionalString(100),
  motherName: optionalString(100),
  dateOfBirth: optionalDate(),
  gender: optionalString(30),
  bloodGroup: optionalString(10),
  medicalHistory: optionalString(1000),
  allergies: optionalString(1000),
  vehicleType: optionalString(50),
  vehicleBrand: optionalString(50),
  vehicleModel: optionalString(50),
  governmentIdType: z.enum(["AADHAAR", "PASSPORT"]).optional(),
  governmentIdNumber: optionalString(30),
  riderFrequency: z.enum(["OCCASIONAL", "WEEKLY", "DAILY"]).optional(),
  ridingClubType: z.enum(["SOLO", "CLUB_MEMBER"]).optional(),
  clubName: optionalString(100),
  emergencyContacts: z.array(emergencyContactSchema).max(3).optional(),
});

export type RiderProfileInput = z.infer<typeof riderProfileSchema>;
