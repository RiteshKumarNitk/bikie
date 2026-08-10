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

/** §37 — summary counts returned alongside `GET /api/admin/partners`. The categories
 * deliberately overlap (same list as the spec): `active` = not admin-SUSPENDED,
 * `unverified` = every non-APPROVED partner, `reported` = owners with ≥1 report. */
export interface AdminPartnerStatsDTO {
  total: number;
  active: number;
  unverified: number;
  draft: number;
  pendingVerification: number;
  moreInfoRequired: number;
  verified: number;
  rejected: number;
  suspended: number;
  reported: number;
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
