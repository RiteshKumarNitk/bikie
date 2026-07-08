import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Messages" };

export default function DashboardMessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <div className="mt-8">
        <EmptyState
          icon="💬"
          title="Messaging is coming soon"
          description="Direct chat with partners is planned for a future release — see the Roadmap."
        />
      </div>
    </div>
  );
}
