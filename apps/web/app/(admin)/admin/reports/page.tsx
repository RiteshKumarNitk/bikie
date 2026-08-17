import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Revenue Reports" };

// Note: this is the *business* reporting stub (revenue/booking/partner performance
// exports), unrelated to trust-and-safety user Reports — those live under
// /admin/moderation now (see ADR-011 / Milestone 8.6b). Named "Revenue Reports" in
// the nav specifically to avoid the collision.
export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Revenue Reports</h1>
      <div className="mt-8">
        <EmptyState
          icon="📊"
          title="Detailed reports are coming soon"
          description="Exportable revenue, booking, and partner performance reports are planned for a future release."
        />
      </div>
    </div>
  );
}
