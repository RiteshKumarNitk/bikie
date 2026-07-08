import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { BookingDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@bikie/utils";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "My Bookings" };

const tabs = [
  { key: "", label: "All" },
  { key: "PENDING,CONFIRMED", label: "Upcoming" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default async function DashboardBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab ?? "";
  const { bookings: allBookings } = await getJson<{ bookings: BookingDTO[] }>("/api/bookings", { auth: true });

  const statuses = activeTab ? activeTab.split(",") : null;
  const bookings = statuses ? allBookings.filter((b) => statuses.includes(b.status)) : allBookings;

  return (
    <div>
      <h1 className="text-2xl font-semibold">My Bookings</h1>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-foreground/10 pb-4">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/dashboard/bookings?tab=${t.key}` : "/dashboard/bookings"}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === t.key ? "bg-accent text-white" : "hover:bg-foreground/5"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No bookings here" actionHref="/explore-bikes" actionLabel="Explore bikes" />
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
                  {new Date(booking.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                  {booking.pickupCity}
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
