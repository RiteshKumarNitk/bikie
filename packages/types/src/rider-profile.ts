/** Rider-profile-level emergency contact (settings/onboarding). Distinct from the
 * ride-specific `EmergencyContactDTO` in ride-room.ts, which belongs to a single Trip. */
export interface RiderEmergencyContactDTO {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relation: string | null;
}

export interface RiderProfileDTO {
  drivingLicenceNumber: string | null;
  drivingLicenceExpiry: string | null;
  addressLine: string | null;
  area: string | null;
  district: string | null;
  pincode: string | null;
  country: string | null;
  // --- ADR-014 ---
  fatherName: string | null;
  motherName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  vehicleType: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  /** ADR-059 — feeds the DLT "BIKIE_SR" SOS dispatch SMS template. */
  vehicleRegistrationNumber: string | null;
  governmentIdType: "AADHAAR" | "PASSPORT" | null;
  governmentIdNumber: string | null;
  riderFrequency: "OCCASIONAL" | "WEEKLY" | "DAILY" | null;
  ridingClubType: "SOLO" | "CLUB_MEMBER" | null;
  clubName: string | null;
  emergencyContacts: RiderEmergencyContactDTO[];
}
