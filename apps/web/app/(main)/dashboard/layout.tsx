import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Action Center", href: "/dashboard" },
    ]
  },
  {
    label: "Community",
    items: [
      { label: "My Rides", href: "/dashboard/trips" },
      { label: "Requests", href: "/dashboard/requests" },
      { label: "Ride Rooms", href: "/dashboard/messages" },
      { label: "Calendar", href: "/dashboard/calendar" },
    ]
  },
  {
    label: "Rentals",
    items: [
      { label: "My Bookings", href: "/dashboard/bookings" },
      { label: "Wishlist", href: "/dashboard/wishlist" },
    ]
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/dashboard/notifications" },
      { label: "Wallet", href: "/dashboard/wallet" },
      { label: "SOS Emergency", href: "/dashboard/sos" },
      { label: "Membership", href: "/dashboard/membership" },
      { label: "Settings", href: "/dashboard/settings" },
    ]
  }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar groups={navGroups} items={[]} title="Dashboard" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
