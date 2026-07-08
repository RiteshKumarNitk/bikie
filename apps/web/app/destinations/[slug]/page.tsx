import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { DestinationDetailDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeCard } from "@/components/shared/BikeCard";
import { EmptyState } from "@/components/shared/EmptyState";

async function getDestination(slug: string) {
  try {
    const { destination } = await getJson<{ destination: DestinationDetailDTO }>(`/api/destinations/${slug}`);
    return destination;
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
  const destination = await getDestination(slug);
  if (!destination) return { title: "Destination Not Found" };
  return {
    title: `Motorcycle Rentals in ${destination.name}`,
    description: destination.description ?? `Find and rent bikes in ${destination.name}, ${destination.state} on BIKIE.`,
  };
}

const infoColumns = (name: string) => [
  { heading: "Popular Routes", items: [`${name} Loop Ride`, "Sunset Viewpoint Trail", "Old Highway Bypass"] },
  { heading: "Top Cafes", items: ["Wanderer's Cafe", "The Ride Stop", "Roadside Chai Point"] },
  { heading: "Fuel Stations", items: ["Central Petrol Pump", "Highway Fuel Station", "Last Fuel Before Pass"] },
  { heading: "Mechanics", items: ["Bike Doctor Garage", "24/7 Roadside Mechanic", "Highway Motor Works"] },
];

export default async function DestinationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  return (
    <div className="pb-24">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Destinations", href: "/destinations" }, { label: destination.name }]}
      />

      <div className="relative mt-4 aspect-[21/9] w-full overflow-hidden">
        <Image src={destination.imageUrl} alt={destination.name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white sm:p-10">
          <h1 className="text-3xl font-semibold sm:text-5xl">{destination.name}</h1>
          <p className="mt-2 text-white/80">
            {destination.state} · {destination.bikeCount} bikes available
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        {destination.description && <p className="max-w-2xl text-foreground/70">{destination.description}</p>}

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Best Bikes in {destination.name}</h2>
          {destination.bikes.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No bikes listed here yet" description="Check back soon or explore other destinations." />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {destination.bikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {infoColumns(destination.name).map((column) => (
            <div key={column.heading}>
              <h3 className="font-semibold">{column.heading}</h3>
              <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-3xl bg-secondary px-8 py-10 text-white">
          <h2 className="text-2xl font-semibold">Plan a Suggested Trip</h2>
          <p className="mt-2 max-w-xl text-white/70">
            Want a guided route through {destination.name}? Browse organized trips with a support vehicle
            and an experienced ride captain.
          </p>
          <a
            href={`/trips?destination=${destination.slug}`}
            className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            View Trips
          </a>
        </section>
      </div>
    </div>
  );
}
