/** ADR-046b — Service Provider application/verification state, decoupled from `User.role`.
 * "NOT_APPLIED" is never stored (see `PartnerVerificationStatus` in the Prisma schema) — API
 * responses surface it when the caller has no `Partner` row at all. */
export type PartnerVerificationStatus =
  | "NOT_APPLIED"
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "MORE_INFORMATION_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface PartnerProfileDTO {
  id: string;
  businessName: string;
  type: string;
  city: string;
  description: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  businessMobile: string | null;
  businessEmail: string | null;
  // --- ADR-014 ---
  contactPerson1Name: string | null;
  contactPerson1Mobile: string | null;
  contactPerson2Name: string | null;
  contactPerson2Mobile: string | null;
  // --- ADR-036 ---
  addressLine: string | null;
  area: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  governmentIdType: "AADHAAR" | "PASSPORT" | null;
  governmentIdNumber: string | null;
  // --- ADR-044 ---
  isAvailable: boolean;
  isGeneralResponder: boolean;
  // --- §6 (OPERATIONS) ---
  workingHours: string | null;
  serviceRadiusKm: number | null;
  yearsOfExperience: number | null;
  // --- ADR-046b: application/verification state ---
  verificationStatus: PartnerVerificationStatus;
  rejectionReason: string | null;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  profilePhotoUrl: string | null;
  shopPhotoUrls: string[];
  identityDocumentUrl: string | null;
  businessDocumentUrl: string | null;
}

/** `GET /api/partner/application` — the one read every "Become a Service Provider" screen
 * polls; `profile` is `null` only while `status === "NOT_APPLIED"`. */
export interface PartnerApplicationDTO {
  status: PartnerVerificationStatus;
  profile: PartnerProfileDTO | null;
}

/** `GET /api/admin/partners/[id]` — the application-review detail screen. */
export interface AdminPartnerDetailDTO {
  profile: PartnerProfileDTO;
  owner: { id: string; name: string; email: string; phone: string | null; createdAt: string };
  history: Array<{
    id: string;
    action: string;
    metadata: Record<string, unknown> | null;
    actorName: string | null;
    createdAt: string;
  }>;
}

export interface PartnerDashboardStatsDTO {
  totalBikes: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  ratingAvg: number;
  ratingCount: number;
}

/** ADR-044 — the partner-facing SOS emergency-assistance dashboard, distinct from
 * `PartnerDashboardStatsDTO` above (that one is bike-rental-listing stats). */
export interface PartnerSosDashboardDTO {
  activeRequests: number;
  todayAssistanceCount: number;
  completedCount: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface PartnerNearbyRequestDTO {
  id: string;
  type: string;
  severity: string;
  city: string;
  distanceMeters: number;
  createdAt: string;
}

/** A partner's own offer that's still awaiting the rider's decision (accept/reject) — distinct
 * from `PartnerNearbyRequestDTO` (excludes anything already responded to) and
 * `PartnerActiveSessionDTO` (only exists once a rider has accepted). */
export interface PartnerPendingOfferDTO {
  offerId: string;
  alertId: string;
  alertType: string;
  severity: string;
  city: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
  createdAt: string;
}

export interface PartnerActiveSessionDTO {
  id: string;
  alertId: string;
  status: string;
  riderName: string;
  alertType: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
}

/** ADR-046b — "Completed Assistance"/"Assistance History" dashboard section. */
export interface PartnerHistorySessionDTO {
  id: string;
  alertId: string;
  status: string;
  riderName: string;
  alertType: string;
  completedAt: string | null;
  cancelledAt: string | null;
  rating: number | null;
}
