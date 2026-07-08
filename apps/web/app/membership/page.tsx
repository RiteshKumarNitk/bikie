import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Membership",
  description: "BIKIE Premium Membership — discounts, free cancellation, priority support, and exclusive trips.",
};

const benefits = [
  { title: "Discounts", desc: "Up to 15% off every booking, automatically applied at checkout." },
  { title: "Free Cancellation", desc: "Cancel any booking up to 24 hours before pickup, no fees." },
  { title: "Priority Support", desc: "Skip the queue with a dedicated support line for members." },
  { title: "Community Access", desc: "Early access to trip seats before they open to everyone else." },
  { title: "Exclusive Trips", desc: "Members-only guided tours to destinations we don't publish publicly." },
  { title: "Reward Points", desc: "Earn points on every ride, redeemable against future bookings." },
];

export default function MembershipPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Membership" }]} />

      <div className="mx-auto max-w-5xl px-6 pt-6 text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">BIKIE Premium Membership</h1>
        <p className="mx-auto mt-3 max-w-xl text-foreground/60">
          One membership, every trip better. ₹999/year.
        </p>
        <Link href="/signup" className="mt-6 inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90">
          Join Membership
        </Link>

        <div className="mt-14 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-3xl bg-card p-6">
              <p className="font-semibold">{b.title}</p>
              <p className="mt-2 text-sm text-foreground/60">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
