import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { partnerBenefits } from "@/lib/partner-content";

export const metadata: Metadata = {
  title: "Benefits",
  description: "Transparent payouts, simple requirements, and dedicated support for BIKIE partners.",
};

export default function PartnerBenefitsPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/partners" }, { label: "Benefits" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Why partners choose BIKIE</h1>
        <p className="mt-3 max-w-2xl text-foreground/60">
          We handle discovery, bookings, and payments so you can focus on riders.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {partnerBenefits.map((b) => (
            <div key={b.title} className="rounded-3xl bg-secondary p-8 text-white">
              <p className="text-lg font-semibold">{b.title}</p>
              <p className="mt-3 text-sm text-white/70">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
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
