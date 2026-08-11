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
  { label: "Membership", href: "/partner/membership" },
  { label: "Settings", href: "/partner/settings" },
];

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login?next=/partner");

  // ADR-053 — accountType is the first, hard gate: a RIDER-accountType account never reaches
  // this dashboard at all, regardless of any historical Partner profile.
  if (session.user.accountType !== "SERVICE_PROVIDER") redirect("/dashboard");

  // ADR-046b/ADR-049 — capability gate: any SERVICE_PROVIDER-accountType account with an active
  // (non-SUSPENDED) profile reaches this dashboard, regardless of verification status — mirrors
  // middleware.ts's own gate exactly. `partnerStatus == null` (a freshly-approved Account Type
  // Change Request, no profile created yet) goes to onboarding instead of a dead-end login
  // redirect.
  const partnerStatus = session.user.partnerStatus;
  if (partnerStatus == null) redirect("/partner-onboarding");
  if (partnerStatus === "SUSPENDED") redirect("/login?next=/partner");

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        <DashboardSidebar items={navItems} title="Partner" />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
