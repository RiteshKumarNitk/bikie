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
}

export interface PartnerDashboardStatsDTO {
  totalBikes: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  ratingAvg: number;
  ratingCount: number;
}
