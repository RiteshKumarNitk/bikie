import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/StatCard";

export const metadata: Metadata = { title: "Wallet" };

export default function DashboardWalletPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Wallet</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Credits, coupons, and refunds — payments are not yet processed live on BIKIE, so balances shown are illustrative.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Wallet Credits" value="₹0" />
        <StatCard label="Active Coupons" value="0" />
        <StatCard label="Pending Refunds" value="₹0" />
      </div>
    </div>
  );
}
