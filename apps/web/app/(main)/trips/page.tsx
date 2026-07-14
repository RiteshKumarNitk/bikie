import type { Metadata } from "next";
import Link from "next/link";
import type { DestinationSummaryDTO, TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Rides",
  description: "Find riders, plan adventures, ride together — community-organized motorcycle rides across India.",
};

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "weekend", label: "Weekend" },
  { key: "adventure", label: "Adventure" },
  { key: "road-trip", label: "Road Trips" },
  { key: "international", label: "International" },
  { key: "completed", label: "Completed" },
];

const difficulties = [
  { key: "EASY", label: "Easy" },
  { key: "MODERATE", label: "Moderate" },
  { key: "HARD", label: "Hard" },
];

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; destination?: string; difficulty?: string; from?: string; to?: string }>;
}) {
  const { tab, destination, difficulty, from, to } = await searchParams;
  const activeTab = tab ?? "upcoming";

  const query = new URLSearchParams({ tab: activeTab });
  if (destination) query.set("destination", destination);
  if (difficulty) query.set("difficulty", difficulty);
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  const [{ trips }, { destinations }] = await Promise.all([
    getJson<{ trips: TripSummaryDTO[] }>(`/api/trips?${query.toString()}`),
    getJson<{ destinations: DestinationSummaryDTO[] }>("/api/destinations"),
  ]);

  const hasFilters = Boolean(destination || difficulty || from || to);

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rides" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">Rides</h1>
            <p className="mt-2 text-foreground/60">Find riders. Plan adventures. Ride together.</p>
          </div>
          <Link
            href="/trips/create"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
          >
            + Create a Ride
          </Link>
        </div>

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

        <form
          action="/trips"
          method="GET"
          className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-foreground/10 bg-card p-4"
        >
          <input type="hidden" name="tab" value={activeTab} />

          <div className="flex flex-col gap-1">
            <label htmlFor="destination" className="text-xs font-medium text-foreground/50">
              Destination
            </label>
            <select
              id="destination"
              name="destination"
              defaultValue={destination ?? ""}
              className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Any destination</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="difficulty" className="text-xs font-medium text-foreground/50">
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={difficulty ?? ""}
              className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Any</option>
              {difficulties.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-xs font-medium text-foreground/50">
              From
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={from ?? ""}
              className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-xs font-medium text-foreground/50">
              To
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={to ?? ""}
              className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Apply filters
          </button>

          {hasFilters && (
            <Link href={`/trips?tab=${activeTab}`} className="text-xs text-foreground/50 hover:underline">
              Clear filters
            </Link>
          )}
        </form>

        {trips.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon="🏍️"
              title="No rides match your filters"
              description="Try clearing a filter, exploring another tab, or create your own."
            />
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
