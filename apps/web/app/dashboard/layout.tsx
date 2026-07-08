import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "My Bookings", href: "/dashboard/bookings" },
  { label: "Wishlist", href: "/dashboard/wishlist" },
  { label: "My Trips", href: "/dashboard/trips" },
  { label: "Messages", href: "/dashboard/messages" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Wallet", href: "/dashboard/wallet" },
  { label: "SOS Emergency", href: "/dashboard/sos" },
  { label: "Membership", href: "/dashboard/membership" },
  { label: "Reviews", href: "/dashboard/reviews" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar items={navItems} title="Dashboard" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
