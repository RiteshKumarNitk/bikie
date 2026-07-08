import type { Metadata } from "next";
import type { TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "My Trips" };

export default async function DashboardTripsPage() {
  const { organized, joined } = await getJson<{ organized: TripSummaryDTO[]; joined: TripSummaryDTO[] }>(
    "/api/trips/mine",
    { auth: true },
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">My Trips</h1>

      <section className="mt-6">
        <h2 className="font-semibold text-foreground/80">Trips Joined</h2>
        {joined.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No joined trips yet" actionHref="/trips" actionLabel="Browse trips" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      {organized.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold text-foreground/80">Trips You Organize</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organized.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
