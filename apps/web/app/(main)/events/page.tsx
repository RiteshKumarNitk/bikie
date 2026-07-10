import type { Metadata } from "next";
import type { TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming group rides and events from the BIKIE rider community.",
};

export default async function EventsPage() {
  const { trips } = await getJson<{ trips: TripSummaryDTO[] }>("/api/trips?tab=upcoming");

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Events" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Events</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          Upcoming rides organized by the community — request to join and meet fellow riders.
        </p>

        {trips.length === 0 ? (
          <div className="mt-10">
            <EmptyState icon="📅" title="No upcoming events yet" description="Check back soon, or organize one yourself." actionHref="/trips/create" actionLabel="Create a Ride" />
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
