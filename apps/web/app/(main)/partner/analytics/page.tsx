import type { Metadata } from "next";
import type { PartnerDashboardStatsDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function PartnerAnalyticsPage() {
  const { stats } = await getJson<{ stats: PartnerDashboardStatsDTO }>("/api/partner/dashboard", { auth: true });
  const completionRate =
    stats.activeBookings + stats.completedBookings > 0
      ? Math.round((stats.completedBookings / (stats.activeBookings + stats.completedBookings)) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Avg. Revenue / Bike" value={formatCurrency(stats.totalBikes > 0 ? Math.round(stats.totalEarnings / stats.totalBikes) : 0)} />
        <StatCard label="Booking Completion Rate" value={`${completionRate}%`} />
        <StatCard label="Rating" value={stats.ratingCount > 0 ? `★ ${stats.ratingAvg.toFixed(1)} (${stats.ratingCount})` : "No ratings yet"} />
      </div>
      <p className="mt-6 text-sm text-foreground/50">
        Deeper analytics (revenue over time, booking trends) are planned for a future release.
      </p>
    </div>
  );
}
