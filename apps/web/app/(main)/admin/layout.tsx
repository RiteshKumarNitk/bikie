import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";

const navGroups = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/admin" },
      { label: "Users", href: "/admin/users" },
      { label: "Partners", href: "/admin/partners" },
      { label: "Bikes", href: "/admin/bikes" },
      { label: "Bookings", href: "/admin/bookings" },
      { label: "Trips", href: "/admin/trips" },
    ],
  },
  {
    label: "Safety",
    items: [
      { label: "SOS", href: "/admin/sos" },
      { label: "Moderation", href: "/admin/moderation" },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Groups", href: "/admin/groups" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Testimonials", href: "/admin/testimonials" },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Membership Plans", href: "/admin/membership" },
      { label: "Referrals", href: "/admin/referrals" },
    ],
  },
  {
    label: "Comms",
    items: [
      { label: "Email", href: "/admin/email" },
      { label: "SMS", href: "/admin/sms" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Audit Logs", href: "/admin/audit-logs" },
      { label: "Revenue Reports", href: "/admin/reports" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

const flatNav = navGroups.flatMap((g) => g.items);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session || session.user.role !== "ADMIN") redirect("/login?next=/admin");

  return (
    <ToastProvider>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <Breadcrumbs />
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <DashboardSidebar groups={navGroups} items={flatNav} title="Admin" />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
