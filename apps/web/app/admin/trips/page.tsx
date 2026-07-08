import type { Metadata } from "next";
import type { TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@bikie/utils";

export const metadata: Metadata = { title: "Trips" };

export default async function AdminTripsPage() {
  const { trips } = await getJson<{ trips: TripSummaryDTO[] }>("/api/trips?tab=upcoming");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Trips ({trips.length})</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Seats</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3">{trip.title}</td>
                <td className="px-5 py-3 text-foreground/60">{trip.type.replace("_", " ")}</td>
                <td className="px-5 py-3 text-foreground/60">
                  {trip.seatsLeft} / {trip.seatsTotal}
                </td>
                <td className="px-5 py-3">{formatCurrency(trip.price)}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium">{trip.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
