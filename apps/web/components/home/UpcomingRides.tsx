import Image from "next/image";
import Link from "next/link";
import type { TripSummaryDTO } from "@bikie/types";
import { formatCurrency } from "@bikie/utils";
import { Reveal } from "@/components/shared/Reveal";

function RideDateRange({ startDate, endDate }: { startDate: string; endDate: string }) {
  const start = new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const end = new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <>
      {start} – {end}
    </>
  );
}

function RideCard({ trip }: { trip: TripSummaryDTO }) {
  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="block overflow-hidden rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={trip.imageUrl}
          alt={trip.title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-black">
          {trip.seatsLeft > 0 ? `${trip.seatsLeft} seats left` : "Full"}
        </span>
      </div>
      <div className="space-y-1 p-5">
        <p className="truncate font-medium">{trip.title}</p>
        <p className="text-sm text-foreground/60">
          {trip.destinationName ?? trip.destination?.name ?? "Multiple stops"} ·{" "}
          <RideDateRange startDate={trip.startDate} endDate={trip.endDate} />
        </p>
        <p className="pt-2 text-sm font-semibold">
          {trip.price > 0 ? (
            <>
              {formatCurrency(trip.price)} <span className="font-normal text-foreground/60">/ rider</span>
            </>
          ) : (
            <span className="text-foreground/60">Free community ride</span>
          )}
        </p>
      </div>
    </Link>
  );
}

export function UpcomingRides({ trips }: { trips: TripSummaryDTO[] }) {
  if (trips.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-foreground/15 px-6 py-16 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Upcoming Rides</h2>
          <p className="max-w-md text-foreground/60">
            No rides are planned yet — be the first to organize one and invite fellow riders along.
          </p>
          <Link
            href="/trips/create"
            className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
          >
            Be the first to plan a ride
          </Link>
        </Reveal>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-semibold md:text-4xl">Upcoming Rides</h2>
          <p className="mt-2 text-foreground/60">Join a community ride and explore India together.</p>
        </div>
        <Link href="/trips" className="hidden text-sm font-medium text-accent-text md:inline">
          See all rides →
        </Link>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {trips.map((trip, index) => (
          <Reveal key={trip.id} delay={index * 0.05}>
            <RideCard trip={trip} />
          </Reveal>
        ))}
      </div>

      <div className="mt-8 text-center md:hidden">
        <Link href="/trips" className="text-sm font-medium text-accent-text">
          See all rides →
        </Link>
      </div>
    </section>
  );
}
