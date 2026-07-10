import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Community",
  description: "Rider stories, featured riders, ride photos, clubs, and upcoming events from the BIKIE community.",
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

const events = [
  { title: "Weekend Ride to Nandi Hills", date: "20 Jul 2026", city: "Bangalore" },
  { title: "Coastal Cruise: Mumbai to Goa", date: "2 Aug 2026", city: "Mumbai" },
  { title: "Himalayan Riders Meetup", date: "14 Aug 2026", city: "Manali" },
];

const clubs = ["Deccan Riders", "Himalayan Wanderers", "Coastal Cruisers Club", "Desert Storm MC"];

export default function CommunityPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Community" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Community</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          Real riders, real roads. Stories, photos, and events from the people who ride with BIKIE.
        </p>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Featured Riders</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {featuredRiders.map((rider) => (
              <div key={rider.name} className="rounded-3xl bg-card p-5 text-center">
                <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full">
                  <Image src={rider.image} alt={rider.name} fill className="object-cover" />
                </div>
                <p className="mt-3 font-medium">{rider.name}</p>
                <p className="text-xs text-foreground/60">
                  {rider.location} · {rider.rides} rides
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold">Ride Photos</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ridePhotos.map((src, i) => (
              <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-3xl">
                <Image src={src} alt={`Community ride ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Upcoming Events</h2>
            <div className="mt-6 space-y-4">
              {events.map((event) => (
                <div key={event.title} className="flex items-center justify-between rounded-2xl bg-card p-5">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-foreground/60">{event.city}</p>
                  </div>
                  <p className="text-sm font-medium text-accent-text">{event.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Rider Clubs</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {clubs.map((club) => (
                <span key={club} className="rounded-full bg-card px-5 py-2.5 text-sm font-medium">
                  {club}
                </span>
              ))}
            </div>

            <div className="mt-8 rounded-3xl bg-secondary p-6 text-white">
              <p className="font-semibold">Weekend Rides, Every Week</p>
              <p className="mt-2 text-sm text-white/70">
                Join a curated weekend ride and meet riders near you.
              </p>
              <Link href="/trips?tab=weekend" className="mt-4 inline-flex text-sm font-medium text-accent-text">
                Browse weekend trips →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
