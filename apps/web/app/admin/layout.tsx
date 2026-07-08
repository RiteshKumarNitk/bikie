import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const navItems = [
  { label: "Overview", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Partners", href: "/admin/partners" },
  { label: "Bikes", href: "/admin/bikes" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Trips", href: "/admin/trips" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session || session.user.role !== "ADMIN") redirect("/login?next=/admin");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar items={navItems} title="Admin" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
