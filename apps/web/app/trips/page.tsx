import type { Metadata } from "next";
import Link from "next/link";
import type { TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Trips",
  description: "Join community and guided motorcycle trips across India — weekend rides, adventure tours, and international expeditions.",
};

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "weekend", label: "Weekend" },
  { key: "adventure", label: "Adventure" },
  { key: "road-trip", label: "Road Trips" },
  { key: "international", label: "International" },
  { key: "completed", label: "Completed" },
];

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab ?? "upcoming";
  const { trips } = await getJson<{ trips: TripSummaryDTO[] }>(`/api/trips?tab=${activeTab}`);

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Trips" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Trips</h1>
        <p className="mt-2 text-foreground/60">Ride together — organized and community trips across India.</p>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-foreground/10 pb-4">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/trips?tab=${t.key}`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === t.key ? "bg-accent text-white" : "hover:bg-foreground/5"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {trips.length === 0 ? (
          <div className="mt-10">
            <EmptyState icon="🗺️" title="No trips in this category yet" description="Check back soon or explore another tab." />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
