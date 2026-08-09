import type { PartnerDashboardStatsDTO, PartnerProfileDTO } from "@bikie/types";

export type PartnerProfileInput = {
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
  // --- ADR-044 ---
  isGeneralResponder?: boolean;
  // --- ADR-046b ---
  profilePhotoUrl?: string;
  shopPhotoUrls?: string[];
  identityDocumentUrl?: string;
  businessDocumentUrl?: string;
};

export type UpsertProfileResult =
  | { ok: true; profile: PartnerProfileDTO }
  | { ok: false; reason: "NOT_EDITABLE"; status: string };

export type SubmitApplicationResult =
  | { ok: true; profile: PartnerProfileDTO }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" | "INCOMPLETE"; status?: string };

export type ReapplyResult =
  | { ok: true; profile: PartnerProfileDTO }
  | { ok: false; reason: "NOT_FOUND" | "INVALID_TRANSITION" };

/** Public "find a service provider near me" result — a lighter shape than PartnerProfileDTO,
 * just what a map pin + list row needs. */
export interface NearbyPartnerRow {
  id: string;
  businessName: string;
  type: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export interface PartnerRepositoryPort {
  findByUserId(userId: string): Promise<PartnerProfileDTO | null>;
  upsertProfile(userId: string, data: PartnerProfileInput): Promise<PartnerProfileDTO>;
  /** ADR-046b — the guarded write `PUT /api/partner/profile` actually uses: refuses while the
   * application is PENDING_VERIFICATION/APPROVED/SUSPENDED. */
  upsertProfileIfEditable(userId: string, data: PartnerProfileInput): Promise<UpsertProfileResult>;
  submitApplication(userId: string): Promise<SubmitApplicationResult>;
  reapply(userId: string): Promise<ReapplyResult>;
  getDashboardStats(userId: string): Promise<PartnerDashboardStatsDTO>;
  findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    options?: { type?: string; take?: number },
  ): Promise<NearbyPartnerRow[]>;
  /** ADR-044 — the SOS-availability toggle. */
  setAvailability(userId: string, isAvailable: boolean): Promise<{ isAvailable: boolean }>;
}

export interface PartnersPorts {
  partners: PartnerRepositoryPort;
}
