import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Reveal } from "@/components/shared/Reveal";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";
import StickyScroll from "@/components/ui/sticky-scroll";

export const metadata: Metadata = {
  title: "Community",
  description: "Rider stories, featured riders, ride photos, clubs, and upcoming rides from the BIKIE community.",
};

const featuredRiders = [
  { name: "Aditya Rao", location: "Bangalore", rides: 24, image: "https://i.pravatar.cc/150?img=12" },
  { name: "Priya Nair", location: "Kochi", rides: 18, image: "https://i.pravatar.cc/150?img=32" },
  { name: "Rohan Mehta", location: "Pune", rides: 31, image: "https://i.pravatar.cc/150?img=45" },
  { name: "Simran Kaur", location: "Delhi", rides: 15, image: "https://i.pravatar.cc/150?img=47" },
];

const ridePhotos = [
  "https://picsum.photos/seed/community-1/600/700",
  "https://picsum.photos/seed/community-2/600/700",
  "https://picsum.photos/seed/community-3/600/700",
  "https://picsum.photos/seed/community-4/600/700",
  "https://picsum.photos/seed/community-5/600/700",
  "https://picsum.photos/seed/community-6/600/700",
];

const clubs = ["Deccan Riders", "Himalayan Wanderers", "Coastal Cruisers Club", "Desert Storm MC"];

export default async function CommunityPage() {
  const { trips } = await getJson<{ trips: TripSummaryDTO[] }>("/api/trips?tab=upcoming");
  const previewRides = trips.slice(0, 3);

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Community" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Reveal>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">Community</h1>
              <p className="mt-2 max-w-xl text-foreground/60">
                Real riders, real roads. Organize a ride, join one someone else is leading, and meet people who ride
                with BIKIE.
              </p>
            </div>
            <Link
              href="/trips/create"
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
            >
              + Create a Ride
            </Link>
          </div>
        </Reveal>

        <section className="mt-12">
          <Reveal>
            <h2 className="text-2xl font-semibold">Featured Riders</h2>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {featuredRiders.map((rider, i) => (
              <Reveal key={rider.name} delay={i * 0.1}>
                <div className="rounded-3xl bg-card p-5 text-center transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full">
                    <Image sizes="64px" src={rider.image} alt={rider.name} fill className="object-cover" />
                  </div>
                  <p className="mt-3 font-medium">{rider.name}</p>
                  <p className="text-xs text-foreground/60">
                    {rider.location} · {rider.rides} rides
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-14 -mx-6">
          <StickyScroll images={ridePhotos} />
        </section>

        <section className="mt-14">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold">Upcoming Rides</h2>
              <Link href="/trips" className="text-sm font-medium text-accent-text hover:underline">
                See all rides →
              </Link>
            </div>
          </Reveal>
          <div className="mt-6">
            {previewRides.length === 0 ? (
              <EmptyState
                icon="🏍️"
                title="No rides yet"
                description="Be the first to organize one — pick a route, set a date, and invite riders to request a seat."
                actionHref="/trips/create"
                actionLabel="Create a Ride"
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {previewRides.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-14">
          <div>
            <Reveal>
              <h2 className="text-2xl font-semibold">Rider Clubs</h2>
            </Reveal>
            <div className="mt-6 flex flex-wrap gap-3">
              {clubs.map((club, i) => (
                <Reveal key={club} delay={i * 0.05} className="inline-block">
                  <span className="rounded-full bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-white cursor-pointer">
                    {club}
                  </span>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <div className="mt-8 rounded-3xl bg-secondary p-6 text-white transition-transform hover:scale-[1.02]">
                <p className="font-semibold">Weekend Rides, Every Week</p>
                <p className="mt-2 text-sm text-white/70">
                  Join a curated weekend ride and meet riders near you.
                </p>
                <Link href="/trips?tab=weekend" className="mt-4 inline-flex text-sm font-medium text-accent-text hover:text-white transition-colors">
                  Browse weekend trips →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </div>
  );
}
