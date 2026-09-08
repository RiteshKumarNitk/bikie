import type { Metadata } from "next";
import { RevenueReport } from "@/components/admin/RevenueReport";

export const metadata: Metadata = { title: "Revenue Reports" };

/** ADR-076 — real revenue + membership reporting, built server-side from the `MembershipInvoice`
 * ledger (immutable purchase-time snapshots, ADR-070). Distinct from trust-and-safety user
 * Reports, which live under /admin/moderation (ADR-011). */
export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Revenue Reports</h1>
      <p className="mt-1 text-sm text-white/50">
        Membership revenue and transaction analytics. Every amount is what was actually paid at the time —
        never recomputed from a plan&apos;s current price.
      </p>
      <RevenueReport />
    </div>
  );
}
