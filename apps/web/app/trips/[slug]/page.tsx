import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { TripDetailDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { formatCurrency } from "@bikie/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { JoinTripCard } from "@/components/trips/JoinTripCard";

async function getTrip(slug: string) {
  try {
    const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
    return trip;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) return { title: "Trip Not Found" };
  return { title: trip.title, description: trip.description };
}

export default async function TripDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) notFound();

  const dateRange = `${new Date(trip.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} – ${new Date(
    trip.endDate,
  ).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Trips", href: "/trips" }, { label: trip.title }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl">
          <Image src={trip.imageUrl} alt={trip.title} fill priority className="object-cover" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-semibold">{trip.title}</h1>
            <p className="mt-1 text-foreground/60">
              {trip.destination?.name ?? "Multiple stops"} · {dateRange}
            </p>
            <p className="mt-6 text-foreground/70">{trip.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-card p-4">
                <p className="text-xs text-foreground/50">Difficulty</p>
                <p className="mt-1 font-medium">{trip.difficulty}</p>
              </div>
              <div className="rounded-2xl bg-card p-4">
                <p className="text-xs text-foreground/50">Type</p>
                <p className="mt-1 font-medium">{trip.type.replace("_", " ")}</p>
              </div>
              <div className="rounded-2xl bg-card p-4">
                <p className="text-xs text-foreground/50">Seats Left</p>
                <p className="mt-1 font-medium">
                  {trip.seatsLeft} / {trip.seatsTotal}
                </p>
              </div>
              <div className="rounded-2xl bg-card p-4">
                <p className="text-xs text-foreground/50">Organizer</p>
                <p className="mt-1 font-medium">{trip.organizer.name}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
              <p className="text-2xl font-semibold">{formatCurrency(trip.price)}</p>
              <p className="text-sm text-foreground/60">per rider</p>
              <JoinTripCard tripId={trip.id} tripSlug={trip.slug} seatsLeft={trip.seatsLeft} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
