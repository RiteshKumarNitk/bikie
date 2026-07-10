import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { partnerTypes } from "@/lib/partner-content";

export const metadata: Metadata = {
  title: "Services",
  description: "Every way to partner with BIKIE — from fleet rentals to roadside mechanics and guided tours.",
};

export default function PartnerServicesPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/partners" }, { label: "Services" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Services you can offer</h1>
        <p className="mt-3 max-w-2xl text-foreground/60">
          Whichever way you serve riders, there&apos;s a place for you on BIKIE.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {partnerTypes.map((type) => (
            <div key={type.title} className="rounded-3xl bg-card p-6">
              <p className="font-semibold">{type.title}</p>
              <p className="mt-2 text-sm text-foreground/60">{type.desc}</p>
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
