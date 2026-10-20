import type { Metadata } from "next";
import { NotificationComposer } from "@/components/admin/NotificationComposer";

export const metadata: Metadata = { title: "Notifications" };

export default function AdminNotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Send Notification</h1>
      <p className="mt-1 text-sm text-white/50">
        Push + in-app announcement to Riders, Service Providers, everyone, or one specific user —
        the same delivery path every other BIKIE notification (bookings, SOS, moderation) already
        uses.
      </p>
      <NotificationComposer />
    </div>
  );
}
