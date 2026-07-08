import type { DestinationSummaryDTO } from "@bikie/types";
import Image from "next/image";
import { Reveal } from "@/components/shared/Reveal";

export function PopularDestinations({
  destinations,
}: {
  destinations: DestinationSummaryDTO[];
}) {
  return (
    <section id="destinations" className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <h2 className="text-3xl font-semibold md:text-4xl">Popular Destinations</h2>
        <p className="mt-2 text-foreground/60">Curated road trips riders love the most.</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination, index) => (
          <Reveal key={destination.id} delay={index * 0.05}>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl">
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
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
