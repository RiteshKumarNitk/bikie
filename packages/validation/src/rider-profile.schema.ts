import { z } from "zod";

const PHONE_REGEX = /^\+?\d{10,15}$/;
const PINCODE_REGEX = /^\d{6}$/;
const AADHAAR_REGEX = /^\d{12}$/;
const PASSPORT_REGEX = /^[A-Za-z][A-Za-z0-9]{6,9}$/;
const ALPHANUMERIC_WITH_SEPARATORS_REGEX = /^[A-Za-z0-9][A-Za-z0-9 -]{6,29}$/;

const MIN_RIDER_AGE = 18;
const MAX_RIDER_AGE = 100;

const emergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  // Strips spaces/hyphens before checking — the form's placeholder ("+91 98765 43210")
  // shows them for readability, so real input formatted the same way shouldn't be rejected.
  phone: z.preprocess(
    (val) => (typeof val === "string" ? val.replace(/[\s-]/g, "") : val),
    z.string().regex(PHONE_REGEX, "Enter a valid phone number (10-15 digits)"),
  ),
  // Optional: SOS fan-out emails contacts who have one, in addition to SMS/WhatsApp.
  email: z.preprocess(emptyToUndefined, z.string().email("Enter a valid email address").max(200).optional()),
  relation: z.string().max(50).optional(),
});

/** Preprocesses empty-string form fields to `undefined` so optional fields don't fail
 * validation just because a form left them blank — every field here is genuinely optional
 * (the whole onboarding form is skippable, see ADR-012), these refinements only kick in once
 * a value is actually provided. */
function emptyToUndefined(val: unknown) {
  return val === "" || val == null ? undefined : val;
}
function optionalString(max: number) {
  return z.preprocess(emptyToUndefined, z.string().max(max).optional());
}
function optionalPattern(max: number, pattern: RegExp, message: string) {
  return z.preprocess(emptyToUndefined, z.string().max(max).regex(pattern, message).optional());
}
function optionalDate() {
  return z.preprocess(emptyToUndefined, z.string().datetime().optional());
}

function age(dateOfBirth: Date): number {
  const now = new Date();
  let years = now.getFullYear() - dateOfBirth.getFullYear();
  const beforeBirthdayThisYear =
    now.getMonth() < dateOfBirth.getMonth() ||
    (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate());
  if (beforeBirthdayThisYear) years -= 1;
  return years;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const riderProfileSchema = z
  .object({
    drivingLicenceNumber: optionalPattern(
      30,
      ALPHANUMERIC_WITH_SEPARATORS_REGEX,
      "Enter a valid licence number (letters/numbers, at least 7 characters)",
    ),
    drivingLicenceExpiry: optionalDate().refine(
      (val) => !val || new Date(val) >= startOfToday(),
      { message: "Licence expiry date can't be in the past" },
    ),
    addressLine: optionalString(200),
    area: optionalString(100),
    district: optionalString(100),
    pincode: optionalPattern(10, PINCODE_REGEX, "Enter a valid 6-digit pincode"),
    country: optionalString(56),
    // --- ADR-014 ---
    fatherName: optionalString(100),
    motherName: optionalString(100),
    dateOfBirth: optionalDate().refine(
      (val) => {
        if (!val) return true;
        const a = age(new Date(val));
        return a >= MIN_RIDER_AGE && a <= MAX_RIDER_AGE;
      },
      { message: `Rider must be between ${MIN_RIDER_AGE} and ${MAX_RIDER_AGE} years old` },
    ),
    gender: optionalString(30),
    bloodGroup: optionalString(10),
    medicalHistory: optionalString(1000),
    allergies: optionalString(1000),
    vehicleType: optionalString(50),
    vehicleBrand: optionalString(50),
    vehicleModel: optionalString(50),
    vehicleRegistrationNumber: optionalString(20),
    governmentIdType: z.enum(["AADHAAR", "PASSPORT"]).optional(),
    governmentIdNumber: optionalString(30),
    riderFrequency: z.enum(["OCCASIONAL", "WEEKLY", "DAILY"]).optional(),
    ridingClubType: z.enum(["SOLO", "CLUB_MEMBER"]).optional(),
    clubName: optionalString(100),
    emergencyContacts: z.array(emergencyContactSchema).max(3).optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field: the government ID number's expected format depends on which ID type was
    // selected, so this can't be expressed on the field's own schema in isolation.
    if (!data.governmentIdNumber) return;
    if (data.governmentIdType === "AADHAAR" && !AADHAAR_REGEX.test(data.governmentIdNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["governmentIdNumber"],
        message: "Aadhaar number must be exactly 12 digits",
      });
    }
    if (data.governmentIdType === "PASSPORT" && !PASSPORT_REGEX.test(data.governmentIdNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["governmentIdNumber"],
        message: "Enter a valid passport number",
      });
    }
    if (!data.governmentIdType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["governmentIdType"],
        message: "Select an ID type to go with the ID number",
      });
    }
  });

export type RiderProfileInput = z.infer<typeof riderProfileSchema>;
