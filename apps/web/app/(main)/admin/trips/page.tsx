import type { Metadata } from "next";
import { prisma } from "@bikie/database";
import { formatCurrency } from "@bikie/utils";
import { requireRole } from "@/lib/require-role";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Trips" };

export default async function AdminTripsPage() {
  const { session, error } = await requireRole("ADMIN");
  if (error) redirect("/login?next=/admin/trips");

  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: { organizer: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Trips ({trips.length})</h1>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-foreground/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Organizer</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Seats Avail.</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-b border-foreground/5 last:border-0">
                <td className="px-5 py-3">{trip.title}</td>
                <td className="px-5 py-3 text-foreground/60">{trip.organizer.name}</td>
                <td className="px-5 py-3 text-foreground/60">{trip.type.replace("_", " ")}</td>
                <td className="px-5 py-3 text-foreground/60">
                  {trip.seatsLeft} of {trip.seatsTotal}
                </td>
                <td className="px-5 py-3">{formatCurrency(trip.price.toNumber())}</td>
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
