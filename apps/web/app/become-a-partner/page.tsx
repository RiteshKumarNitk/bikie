import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Become a Partner",
  description: "List your bikes, offer services, or guide tours on BIKIE — India's premium motorcycle travel platform.",
};

const partnerTypes = [
  { title: "Rental Partner", desc: "List your fleet and reach thousands of verified riders." },
  { title: "Mechanic", desc: "Offer roadside repairs and scheduled maintenance." },
  { title: "Fuel Delivery", desc: "Deliver fuel to stranded riders on demand." },
  { title: "Tour Guide", desc: "Lead guided rides and earn per trip." },
  { title: "Hotel", desc: "List rider-friendly stays along popular routes." },
  { title: "Camping", desc: "Offer campsites for overnight touring groups." },
  { title: "Accessories", desc: "Sell riding gear directly to BIKIE customers." },
  { title: "Photography", desc: "Capture rider memories at scenic checkpoints." },
];

const benefits = [
  { title: "Earnings", desc: "Transparent payouts, weekly settlement, no hidden commission surprises." },
  { title: "Requirements", desc: "Valid business registration or ID proof, and a verification call." },
  { title: "Support", desc: "A dedicated partner success manager for onboarding and growth." },
];

export default function BecomeAPartnerPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Become a Partner" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold md:text-4xl">Partner with BIKIE</h1>
          <p className="mt-3 text-foreground/60">
            Turn your fleet, garage, or expertise into a source of income. Partner mode unlocks
            bookings, analytics, and payouts — all from one dashboard.
          </p>
          <Link
            href="/signup?role=partner"
            className="mt-6 inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Apply Now
          </Link>
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Partner Types</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partnerTypes.map((type) => (
              <div key={type.title} className="rounded-3xl bg-card p-6">
                <p className="font-semibold">{type.title}</p>
                <p className="mt-2 text-sm text-foreground/60">{type.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-3xl bg-secondary p-6 text-white">
              <p className="font-semibold">{b.title}</p>
              <p className="mt-2 text-sm text-white/70">{b.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
