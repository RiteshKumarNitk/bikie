import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Reports</h1>
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
