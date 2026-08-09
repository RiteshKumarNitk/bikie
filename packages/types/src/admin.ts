import type { PartnerVerificationStatus } from "./partner";

/** `GET /api/admin/partners` list row. */
export interface AdminPartnerRowDTO {
  id: string;
  businessName: string;
  type: string;
  city: string;
  verificationStatus: PartnerVerificationStatus;
  ratingAvg: number;
  ratingCount: number;
  owner: { name: string; email: string };
}

export interface AdminOverviewStatsDTO {
  totalUsers: number;
  totalPartners: number;
  totalBikes: number;
  totalBookings: number;
  totalTrips: number;
  revenueTotal: number;
  monthlyBookings: { month: string; count: number }[];
  monthlyRevenue: { month: string; amount: number }[];
  bookingsByStatus: { status: string; count: number }[];
  bikesByCity: { city: string; count: number }[];
}
