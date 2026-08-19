import type { Metadata } from "next";
import Image from "next/image";
import type { BookingDTO } from "@bikie/types";
import { getJsonOrFallback } from "@/lib/api";
import { formatCurrency } from "@bikie/utils";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Bookings" };

export default async function PartnerBookingsPage() {
  const { bookings } = await getJsonOrFallback<{ bookings: BookingDTO[] }>(
    "/api/partner/bookings",
    { bookings: [] },
    { auth: true },
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Bookings</h1>
      {bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No bookings yet" description="Bookings for your fleet will show up here." />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center gap-4 rounded-3xl bg-card p-4">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                <Image src={booking.bike.imageUrl} alt={booking.bike.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{booking.bike.name}</p>
                <p className="text-sm text-foreground/60">
                  {new Date(booking.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                  {new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(booking.totalPrice)}</p>
                <span className="text-xs font-medium text-foreground/50">{booking.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
