import type { Metadata } from "next";
import Link from "next/link";
import type { RideStatsDTO, TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "My Rides" };

export default async function DashboardTripsPage() {
  const { organized, joined, requested, stats } = await getJson<{
    organized: TripSummaryDTO[];
    joined: TripSummaryDTO[];
    requested: TripSummaryDTO[];
    stats: RideStatsDTO;
  }>("/api/trips/mine", { auth: true });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Rides</h1>
        <Link
          href="/trips/create"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
        >
          + Create a Ride
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-card p-4">
          <p className="text-xs text-foreground/50">Organized</p>
          <p className="mt-1 text-xl font-semibold">{stats.ridesOrganized}</p>
        </div>
        <div className="rounded-2xl bg-card p-4">
          <p className="text-xs text-foreground/50">Requests Sent</p>
          <p className="mt-1 text-xl font-semibold">{stats.requestsSent}</p>
        </div>
        <div className="rounded-2xl bg-card p-4">
          <p className="text-xs text-foreground/50">Approval Rate</p>
          <p className="mt-1 text-xl font-semibold">{stats.approvalRate !== null ? `${stats.approvalRate}%` : "—"}</p>
        </div>
        <div className="rounded-2xl bg-card p-4">
          <p className="text-xs text-foreground/50">Cancelled</p>
          <p className="mt-1 text-xl font-semibold">{stats.ridesCancelled}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold text-foreground/80">Rides Joined</h2>
        {joined.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No joined rides yet" actionHref="/trips" actionLabel="Browse rides" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>

      {requested.length > 0 && (
        <section className="mt-10">
          <h2 className="font-semibold text-foreground/80">Requested — Awaiting Approval</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {requested.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-semibold text-foreground/80">Rides You Organize</h2>
        {organized.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="You haven't published a ride yet"
              description="Organize a ride and let the community request to join — you approve who rides with you."
              actionHref="/trips/create"
              actionLabel="+ Create a Ride"
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organized.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
