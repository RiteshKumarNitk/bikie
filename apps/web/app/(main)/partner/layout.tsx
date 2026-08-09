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
  // ADR-046b — capability gate, not a role check: any account with an APPROVED Partner
  // application reaches this dashboard, RENTER or (legacy) PARTNER role alike.
  if (!session || session.user.partnerStatus !== "APPROVED") redirect("/login?next=/partner");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar items={navItems} title="Partner" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
