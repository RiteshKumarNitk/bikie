import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { DestinationSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Discover India's best motorcycle destinations — Ladakh, Spiti, Goa, Coorg, and more.",
};

export default async function DestinationsPage() {
  const { destinations } = await getJson<{ destinations: DestinationSummaryDTO[] }>("/api/destinations");

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Destinations" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Destinations</h1>
        <p className="mt-2 text-foreground/60">Travel inspiration for your next ride.</p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <Link
              key={destination.id}
              href={`/destinations/${destination.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-3xl"
            >
              <Image
                src={destination.imageUrl}
                alt={destination.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <p className="text-lg font-semibold">{destination.name}</p>
                <p className="text-sm text-white/75">
                  {destination.state} · {destination.bikeCount} bikes
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
