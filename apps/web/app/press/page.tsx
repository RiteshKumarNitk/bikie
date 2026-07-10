import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Press",
  description: "Media coverage and press resources for BIKIE.",
};

const mentions = [
  { outlet: "Motoring Weekly", title: "BIKIE is rethinking how India rents motorcycles", date: "Mar 2026" },
  { outlet: "Startup Digest", title: "The Airbnb-for-bikes platform gaining riders across India", date: "Jan 2026" },
  { outlet: "TravelTech India", title: "Curated, not crowded: inside BIKIE's product philosophy", date: "Nov 2025" },
];

export default function PressPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Press" }]} />

      <div className="mx-auto max-w-3xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Press</h1>
        <p className="mt-2 text-foreground/60">
          For media inquiries, contact{" "}
          <a href="mailto:press@bikie.app" className="text-accent-text">
            press@bikie.app
          </a>
          .
        </p>

        <div className="mt-10 space-y-4">
          {mentions.map((mention) => (
            <div key={mention.title} className="rounded-2xl bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-accent-text">{mention.outlet}</p>
              <p className="mt-2 font-medium">{mention.title}</p>
              <p className="mt-1 text-sm text-foreground/50">{mention.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
