import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@bikie/utils";
import type { TripSummaryDTO } from "@bikie/types";

const statusColor: Record<string, string> = {
  DRAFT: "bg-foreground/10 text-foreground",
  PUBLISHED: "bg-accent/10 text-accent-text",
  UPCOMING: "bg-green-500/10 text-green-500",
  IN_PROGRESS: "bg-warning/10 text-warning",
  COMPLETED: "bg-foreground/5 text-foreground/50",
  CANCELLED: "bg-red-500/10 text-red-500",
};

export function TripCard({ trip }: { trip: TripSummaryDTO }) {
  const dateRange = `${new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(
    trip.endDate,
  ).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] border border-foreground/5 flex flex-col">
      <Link href={`/trips/${trip.slug}`} className="relative aspect-[4/3] block">
        <Image src={trip.imageUrl} alt={trip.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${statusColor[trip.status] ?? "bg-foreground/10"}`}>
          {trip.status.replace("_", " ")}
        </span>
      </Link>
      
      <div className="flex-1 space-y-4 p-5 flex flex-col">
        <div>
          <Link href={`/trips/${trip.slug}`} className="font-semibold text-lg hover:underline block truncate">{trip.title}</Link>
          <p className="text-sm text-foreground/60 mt-1">
            {trip.destinationName ?? trip.destination?.name ?? "Multiple stops"} • {dateRange}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm bg-foreground/5 p-3 rounded-2xl flex-1">
          <div className="flex flex-col">
            <span className="text-foreground/50 text-xs font-medium">Members</span>
            <span className="font-semibold">{trip.membersCount ?? (trip.seatsTotal - trip.seatsLeft)}/{trip.seatsTotal}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground/50 text-xs font-medium">Pending</span>
            <span className="font-semibold text-warning">{trip.pendingRequests ?? 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground/50 text-xs font-medium">Messages</span>
            <span className="font-semibold text-accent-text">{trip.unreadMessages ?? 0} Unread</span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground/50 text-xs font-medium">Price</span>
            <span className="font-semibold">{formatCurrency(trip.price)}</span>
          </div>
        </div>

        <Link href={`/trips/${trip.slug}/manage`} className="block w-full py-2.5 rounded-xl bg-foreground/10 text-center text-sm font-semibold hover:bg-foreground/20 transition-colors mt-auto">
          Manage Ride
        </Link>
      </div>
    </div>
  );
}
