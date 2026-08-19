import type { Metadata } from "next";
import type { PartnerDashboardStatsDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { getServerSession } from "@/lib/get-session";
import { StatCard } from "@/components/dashboard/StatCard";
import { PartnerVerificationBanner } from "@/components/partner/PartnerVerificationBanner";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Partner Dashboard" };

const defaultStats: PartnerDashboardStatsDTO = {
  totalBikes: 0,
  activeBookings: 0,
  completedBookings: 0,
  totalEarnings: 0,
  ratingAvg: 0,
  ratingCount: 0,
};

export default async function PartnerOverviewPage() {
  const session = await getServerSession();
  let stats: PartnerDashboardStatsDTO = defaultStats;
  try {
    const res = await getJson<{ stats: PartnerDashboardStatsDTO }>("/api/partner/dashboard", { auth: true });
    stats = res.stats;
  } catch {
    // Fall back to default initial stats if membership/data is not yet populated
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome back, {session?.user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-foreground/60">Here&apos;s how your fleet is performing.</p>

      {/* FINAL PRODUCT MODEL — verification status is a separate, optional trust layer shown
      here, never a gate: the profile is already live and operational. */}
      <PartnerVerificationBanner />

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
