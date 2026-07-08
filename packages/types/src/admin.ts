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
