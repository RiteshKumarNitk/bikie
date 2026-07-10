import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { partnerPricingTiers } from "@/lib/partner-content";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for BIKIE partners — from a free starter listing to enterprise fleets.",
};

export default function PartnerPricingPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/partners" }, { label: "Pricing" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-3 max-w-2xl text-foreground/60">
          No listing fees to get started. Pay only when you get bookings.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {partnerPricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-8 ${
                tier.highlighted ? "bg-accent text-white ring-2 ring-accent" : "bg-card"
              }`}
            >
              <p className={`text-sm font-semibold uppercase tracking-wide ${tier.highlighted ? "text-white/80" : "text-foreground/50"}`}>
                {tier.name}
              </p>
              <p className="mt-2 text-3xl font-semibold">{tier.price}</p>
              <p className={`mt-2 text-sm ${tier.highlighted ? "text-white/80" : "text-foreground/60"}`}>
                {tier.tagline}
              </p>
              <ul className="mt-6 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${tier.highlighted ? "text-white/90" : "text-foreground/70"}`}>
                    <span aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-foreground/40">
          Billing shown for illustration — final pricing is confirmed during onboarding.
        </p>

        <div className="mt-10">
          <Link
            href="/signup?role=partner"
            className="inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Register Business
          </Link>
        </div>
      </div>
    </div>
  );
}
