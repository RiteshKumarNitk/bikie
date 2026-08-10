import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

const navItems = [
  { label: "Overview", href: "/partner" },
  { label: "SOS Emergency", href: "/partner/sos" },
  { label: "Fleet", href: "/partner/fleet" },
  { label: "Bookings", href: "/partner/bookings" },
  { label: "Messages", href: "/partner/messages" },
  { label: "Analytics", href: "/partner/analytics" },
  { label: "Trips", href: "/partner/trips" },
  { label: "Reviews", href: "/partner/reviews" },
  { label: "Payouts", href: "/partner/payouts" },
  { label: "Settings", href: "/partner/settings" },
];

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  // ADR-046b/ADR-049 — capability gate, not a role check and not a verification check: any
  // account with an active (non-SUSPENDED) Service Provider profile reaches this dashboard,
  // regardless of `role` or verification status — mirrors middleware.ts's own gate exactly.
  const partnerStatus = session?.user.partnerStatus;
  if (!session || partnerStatus == null || partnerStatus === "SUSPENDED") redirect("/login?next=/partner");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar items={navItems} title="Partner" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
