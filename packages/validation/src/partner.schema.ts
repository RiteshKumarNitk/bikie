import { z } from "zod";

const PINCODE_REGEX = /^\d{6}$/;
const AADHAAR_REGEX = /^\d{12}$/;
const PASSPORT_REGEX = /^[A-Za-z][A-Za-z0-9]{6,9}$/;

/** Mirrors rider-profile.schema.ts's emptyToUndefined — a form field left blank shouldn't fail
 * validation just because it's an empty string rather than an omitted key. */
function emptyToUndefined(val: unknown) {
  return val === "" || val == null ? undefined : val;
}
function optionalString(max: number) {
  return z.preprocess(emptyToUndefined, z.string().max(max).optional());
}
function optionalPattern(max: number, pattern: RegExp, message: string) {
  return z.preprocess(emptyToUndefined, z.string().max(max).regex(pattern, message).optional());
}

/** Shared across provider self-service onboarding, admin category edits, and the public
 * nearby-partners type filter — kept as one list so the three never drift apart. */
export const partnerTypeEnum = z.enum([
  "RENTAL",
  "MECHANIC",
  "FUEL_DELIVERY",
  "TOUR_GUIDE",
  "HOTEL",
  "CAMPING",
  "ACCESSORIES",
  "PHOTOGRAPHY",
]);

export type PartnerType = z.infer<typeof partnerTypeEnum>;

export const partnerProfileSchema = z
  .object({
    businessName: z.string({ error: "Business name is required" }).min(1).max(120),
    type: partnerTypeEnum,
    city: z.string({ error: "City is required" }).min(1).max(100),
    description: z.string().max(1000).optional(),
    businessMobile: z
      .string({ error: "Business mobile number is required" })
      .min(10, "Enter a valid mobile number")
      .max(20),
    businessEmail: z.string({ error: "Business email is required" }).email("Enter a valid email address"),
    contactPerson1Name: z.string().max(100).optional(),
    contactPerson1Mobile: z.string().max(20).optional(),
    contactPerson2Name: z.string().max(100).optional(),
    contactPerson2Mobile: z.string().max(20).optional(),
    // --- ADR-036: shop address + map pin + typed government ID ---
    addressLine: optionalString(200),
    area: optionalString(100),
    pincode: optionalPattern(10, PINCODE_REGEX, "Enter a valid 6-digit pincode"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    governmentIdType: z.enum(["AADHAAR", "PASSPORT"]).optional(),
    governmentIdNumber: optionalString(30),
    // --- §6 (OPERATIONS): working hours, service radius, experience — all optional, a local
    // mechanic without fixed business hours or a big service area must still be able to register ---
    workingHours: optionalString(200),
    serviceRadiusKm: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(500).optional(),
    ),
    yearsOfExperience: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).max(100).optional(),
    ),
    // --- ADR-044: explicit opt-in to be dispatched SOS categories outside this partner's own
    // `type` (e.g. a FUEL_DELIVERY partner receiving a MEDICAL emergency) ---
    isGeneralResponder: z.boolean().optional(),
    // --- ADR-046b: application photos/documents, all uploaded via the existing POST /api/upload
    // (Cloudinary, image-only) and passed here as URLs, same pattern as Bike.gallery/Trip.gallery ---
    profilePhotoUrl: optionalString(500),
    shopPhotoUrls: z.array(z.string().max(500)).max(8).optional(),
    identityDocumentUrl: optionalString(500),
    businessDocumentUrl: optionalString(500),
  })
  .superRefine((data, ctx) => {
    // Cross-field: a map pin without both coordinates is a bug, not a valid partial state —
    // the picker always sets both together, so a mismatch means something upstream broke.
    if ((data.latitude === undefined) !== (data.longitude === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["longitude"],
        message: "latitude and longitude must be provided together",
      });
    }

    // Same government-ID cross-field validation as rider-profile.schema.ts — the expected
    // number format depends on which ID type was selected.
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

export type PartnerProfileInput = z.infer<typeof partnerProfileSchema>;

/** ADR-046b — `POST /api/admin/partners/[id]` verification-decision body. `reason` is required
 * for every action except APPROVE (a clean approval needs no explanation back to the applicant). */
export const partnerVerificationActionSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT", "REQUEST_INFO", "SUSPEND", "RESTORE"]),
    reason: z.string().min(1).max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action !== "APPROVE" && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "A reason is required for this action",
      });
    }
  });

export type PartnerVerificationActionInput = z.infer<typeof partnerVerificationActionSchema>;

/** PATCH /api/admin/partners/[id]/type — admin sets/changes a provider's service category,
 * independent of the verification-decision endpoint above. */
export const updatePartnerTypeSchema = z.object({
  type: partnerTypeEnum,
});

export type UpdatePartnerTypeInput = z.infer<typeof updatePartnerTypeSchema>;

/** GET /api/partners/nearby query params — public "find a service provider" (ADR-036). */
export const nearbyPartnersQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  type: partnerTypeEnum.optional(),
  // Opt-in: only providers a rider could actually reach right now (available + active
  // membership) — same eligibility rule SOS dispatch already uses. `"true"` only; anything else
  // (including absent) keeps the existing unfiltered directory behavior.
  eligibleOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type NearbyPartnersQueryInput = z.infer<typeof nearbyPartnersQuerySchema>;

/** PATCH /api/partner/availability (ADR-044). */
export const partnerAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type PartnerAvailabilityInput = z.infer<typeof partnerAvailabilitySchema>;

/** GET /api/partner/sos/nearby query params (ADR-044) — mirrors nearbyPartnersQuerySchema. */
export const partnerNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type PartnerNearbyQueryInput = z.infer<typeof partnerNearbyQuerySchema>;
