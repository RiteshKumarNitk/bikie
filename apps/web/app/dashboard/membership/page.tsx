import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Membership" };

export default function DashboardMembershipPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Membership</h1>
      <div className="mt-6 rounded-3xl bg-card p-6">
        <p className="font-medium">You&apos;re not a member yet</p>
        <p className="mt-2 text-sm text-foreground/60">
          Join BIKIE Premium for discounts, free cancellation, and priority support.
        </p>
        <Link href="/membership" className="mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90">
          View Membership Plans
        </Link>
      </div>
    </div>
  );
}
