import type { Metadata } from "next";
import type { PartnerDashboardStatsDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Payouts" };

export default async function PartnerPayoutsPage() {
  const { stats } = await getJson<{ stats: PartnerDashboardStatsDTO }>("/api/partner/dashboard", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Payouts</h1>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Lifetime Earnings" value={formatCurrency(stats.totalEarnings)} />
        <StatCard label="Next Payout" value="Not scheduled" />
      </div>
      <p className="mt-6 text-sm text-foreground/50">
        Real payout processing via Razorpay is planned for a future release — see the Roadmap.
      </p>
    </div>
  );
}
