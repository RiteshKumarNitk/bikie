import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "About Us",
  description: "BIKIE's mission, story, and the team building India's premium motorcycle travel platform.",
};

const timeline = [
  { year: "2023", event: "BIKIE founded with a single fleet in Jaipur." },
  { year: "2024", event: "Expanded to 6 destinations across North and South India." },
  { year: "2025", event: "Crossed 10,000 bookings and launched Partner Mode." },
  { year: "2026", event: "Building the full BIKIE travel ecosystem — trips, community, and more." },
];

export default function AboutPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />

      <div className="mx-auto max-w-4xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">About BIKIE</h1>
        <p className="mt-4 text-foreground/70">
          BIKIE is India&apos;s premium motorcycle travel platform. We believe renting a bike for a
          road trip shouldn&apos;t mean choosing between five different providers and hoping for the
          best — it should feel as simple as searching for the ride you want.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Our Mission</h2>
          <p className="mt-2 text-foreground/70">
            To make motorcycle travel in India as trustworthy, transparent, and enjoyable as the
            destinations riders are chasing.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Our Vision</h2>
          <p className="mt-2 text-foreground/70">
            A single platform where every rider can find the bike, the route, and the community for
            their next trip — anywhere in India.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Why BIKIE</h2>
          <p className="mt-2 text-foreground/70">
            Curated instead of crowded. Every bike is verified, every partner vetted, and every
            destination guide written by riders who&apos;ve actually made the trip.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Timeline</h2>
          <div className="mt-6 space-y-6 border-l border-foreground/10 pl-6">
            {timeline.map((item) => (
              <div key={item.year} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-accent" />
                <p className="text-sm font-semibold text-accent">{item.year}</p>
                <p className="mt-1 text-foreground/70">{item.event}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
