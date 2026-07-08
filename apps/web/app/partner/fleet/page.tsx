import type { Metadata } from "next";
import type { BikeSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { BikeCard } from "@/components/shared/BikeCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Fleet" };

export default async function PartnerFleetPage() {
  const { bikes } = await getJson<{ bikes: BikeSummaryDTO[] }>("/api/partner/bikes", { auth: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Fleet</h1>
      {bikes.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No bikes listed yet" description="Add your first bike to start receiving bookings." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.map((bike) => (
            <BikeCard key={bike.id} bike={bike} />
          ))}
        </div>
      )}
    </div>
  );
}
