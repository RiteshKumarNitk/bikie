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
}

export interface PartnerDashboardStatsDTO {
  totalBikes: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  ratingAvg: number;
  ratingCount: number;
}
