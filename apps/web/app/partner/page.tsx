import type { Metadata } from "next";
import type { PartnerDashboardStatsDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { getServerSession } from "@/lib/get-session";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Partner Dashboard" };

export default async function PartnerOverviewPage() {
  const session = await getServerSession();
  const { stats } = await getJson<{ stats: PartnerDashboardStatsDTO }>("/api/partner/dashboard", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back, {session?.user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-foreground/60">Here&apos;s how your fleet is performing.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Bikes" value={stats.totalBikes} />
        <StatCard label="Active Bookings" value={stats.activeBookings} />
        <StatCard label="Completed" value={stats.completedBookings} />
        <StatCard label="Total Earnings" value={formatCurrency(stats.totalEarnings)} />
        <StatCard label="Rating" value={stats.ratingCount > 0 ? `★ ${stats.ratingAvg.toFixed(1)}` : "No ratings yet"} />
      </div>
    </div>
  );
}
