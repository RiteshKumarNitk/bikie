import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { LogoMark } from "@/components/layout/LogoMark";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import Link from "next/link";

// Standalone admin shell — deliberately NOT inside the (main) route group, so the public
// marketing Navbar/Footer never wrap the admin dashboard. Header chrome here is intentionally
// minimal: brand + admin identity + sign-out + a back-to-site link.
const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Account Type Requests", href: "/admin/account-type-requests" },
    ],
  },
  {
    label: "Riders",
    items: [
      { label: "All Rider Accounts", href: "/admin/users?type=RIDER" },
      { label: "Bikes", href: "/admin/bikes" },
      { label: "Bookings", href: "/admin/bookings" },
      { label: "Trips", href: "/admin/trips" },
      { label: "Groups", href: "/admin/groups" },
      { label: "Moderation", href: "/admin/moderation" },
    ],
  },
  {
    label: "Service Providers",
    items: [
      { label: "All Provider Accounts", href: "/admin/users?type=SERVICE_PROVIDER" },
      { label: "Partners", href: "/admin/partners" },
      { label: "SOS", href: "/admin/sos" },
      { label: "Referrals", href: "/admin/referrals" },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Membership Plans", href: "/admin/membership" },
      { label: "Service Provider Membership", href: "/admin/partner-membership" },
      { label: "Testimonials", href: "/admin/testimonials" },
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

  const initials = session.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <LogoMark size="sm" />
              <div>
                <p className="text-sm font-semibold">BIKIE Admin</p>
                <p className="text-xs text-foreground/50">Platform dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                View site
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-text">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-tight">{session.user.name}</p>
                  <p className="text-xs leading-tight text-foreground/50">Admin</p>
                </div>
              </div>
              <AdminSignOutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
          <Breadcrumbs />
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <DashboardSidebar groups={navGroups} items={flatNav} title="Admin" />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
