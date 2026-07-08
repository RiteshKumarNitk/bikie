import type { Metadata } from "next";
import type { TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Trips" };

export default async function PartnerTripsPage() {
  const { organized } = await getJson<{ organized: TripSummaryDTO[]; joined: TripSummaryDTO[] }>(
    "/api/trips/mine",
    { auth: true },
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Trips You Organize</h1>
      {organized.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="You haven't organized any trips yet" description="List a guided tour to start taking bookings." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {organized.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
