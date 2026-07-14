import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { NotificationsTab } from "@/components/chat/NotificationsTab";

export const metadata: Metadata = { title: "Notifications" };

export default async function DashboardNotificationsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/dashboard/notifications");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Ride requests, approvals, and other updates land here.
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-foreground/10 bg-card/30">
        <NotificationsTab userId={session.user.id} />
      </div>
    </div>
  );
}
