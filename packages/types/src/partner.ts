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

export interface PartnerActiveSessionDTO {
  id: string;
  alertId: string;
  status: string;
  riderName: string;
  alertType: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
}
