import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { NearbyPartnersPanel } from "@/components/shared/NearbyPartnersPanel";

export const metadata: Metadata = {
  title: "Roadside Assistance",
  description: "24/7 roadside assistance for breakdowns, flat tyres, fuel delivery, and towing.",
};

const services = [
  { title: "Bike Breakdown", desc: "On-site diagnosis and repair for mechanical failures." },
  { title: "Flat Tyre", desc: "Puncture repair or tyre replacement at your location." },
  { title: "Fuel Delivery", desc: "Emergency fuel delivered when you're stranded." },
  { title: "Battery Jump Start", desc: "Quick jump-start service for a dead battery." },
  { title: "Towing", desc: "Vehicle towing to the nearest partner garage." },
  { title: "Medical Assistance", desc: "Coordination with local emergency medical services." },
];

export default function RoadsideAssistancePage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Roadside Assistance" }]} />

      <div className="mx-auto max-w-5xl px-6 pt-6">
        <div className="rounded-3xl bg-secondary p-8 text-center text-white sm:p-12">
          <h1 className="text-3xl font-semibold md:text-4xl">24/7 Roadside Assistance</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Stranded on the road? Help is one call away, anywhere in India.
          </p>
          <a
            href="tel:+911800123456"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-semibold text-white hover:bg-accent/90"
          >
            🚨 Call Emergency Assistance
          </a>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="rounded-3xl bg-card p-6">
              <p className="font-semibold">{service.title}</p>
              <p className="mt-2 text-sm text-foreground/60">{service.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <NearbyPartnersPanel />
        </div>
      </div>
    </div>
  );
}
