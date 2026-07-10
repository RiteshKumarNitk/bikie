import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { partnerBenefits, partnerTypes } from "@/lib/partner-content";

export const metadata: Metadata = {
  title: "Partner with BIKIE",
  description: "List your bikes, offer services, or guide tours on BIKIE — India's premium motorcycle travel platform.",
};

export default function PartnersHomePage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/partners" }, { label: "Partners" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold md:text-4xl">Grow your motorcycle business with BIKIE</h1>
          <p className="mt-3 text-foreground/60">
            Turn your fleet, garage, or expertise into a source of income. Partner mode unlocks
            bookings, analytics, and payouts — all from one dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signup?role=partner"
              className="inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Register Business
            </Link>
            <Link
              href="/partners/pricing"
              className="inline-flex rounded-full border border-foreground/15 px-8 py-3 text-sm font-semibold hover:bg-foreground/5"
            >
              See pricing
            </Link>
          </div>
        </div>

        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Services you can offer</h2>
            <Link href="/partners/services" className="text-sm font-medium text-accent-text hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partnerTypes.slice(0, 4).map((type) => (
              <div key={type.title} className="rounded-3xl bg-card p-6">
                <p className="font-semibold">{type.title}</p>
                <p className="mt-2 text-sm text-foreground/60">{type.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Why partners choose BIKIE</h2>
            <Link href="/partners/benefits" className="text-sm font-medium text-accent-text hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {partnerBenefits.map((b) => (
              <div key={b.title} className="rounded-3xl bg-secondary p-6 text-white">
                <p className="font-semibold">{b.title}</p>
                <p className="mt-2 text-sm text-white/70">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
