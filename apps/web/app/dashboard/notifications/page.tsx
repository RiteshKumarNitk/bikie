import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Notifications" };

export default function DashboardNotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <div className="mt-8">
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          description="Real-time push notifications are planned for a future release — see the Roadmap."
        />
      </div>
    </div>
  );
}
