import type { Metadata } from "next";
import type { AdminOverviewStatsDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminOverviewPage() {
  const { stats } = await getJson<{ stats: AdminOverviewStatsDTO }>("/api/admin/overview", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Platform Overview</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Partners" value={stats.totalPartners} />
        <StatCard label="Bikes" value={stats.totalBikes} />
        <StatCard label="Bookings" value={stats.totalBookings} />
        <StatCard label="Trips" value={stats.totalTrips} />
        <StatCard label="Revenue" value={formatCurrency(stats.revenueTotal)} />
      </div>
    </div>
  );
}
