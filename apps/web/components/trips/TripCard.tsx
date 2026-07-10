import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@bikie/utils";
import type { TripSummaryDTO } from "@bikie/types";

const difficultyColor: Record<string, string> = {
  EASY: "text-green-400",
  MODERATE: "text-warning",
  HARD: "text-accent-text",
};

export function TripCard({ trip }: { trip: TripSummaryDTO }) {
  const dateRange = `${new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(
    trip.endDate,
  ).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

  return (
    <Link href={`/trips/${trip.slug}`} className="overflow-hidden rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-[4/3]">
        <Image src={trip.imageUrl} alt={trip.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
        <span className={`absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium ${difficultyColor[trip.difficulty] ?? "text-white"}`}>
          {trip.difficulty}
        </span>
      </div>
      <div className="space-y-1 p-5">
        <p className="font-medium">{trip.title}</p>
        <p className="text-sm text-foreground/60">
          {trip.destination?.name ?? "Multiple stops"} · {dateRange}
        </p>
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-semibold">{formatCurrency(trip.price)}</p>
          <p className="text-xs text-foreground/60">{trip.seatsLeft} seats left</p>
        </div>
      </div>
    </Link>
  );
}
