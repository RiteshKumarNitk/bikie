import Link from "next/link";
import type { BikeSummaryDTO } from "@bikie/types";
import { Reveal } from "@/components/shared/Reveal";
import { BikeCard } from "@/components/shared/BikeCard";

export function FeaturedBikes({ bikes }: { bikes: BikeSummaryDTO[] }) {
  return (
    <section id="bikes" className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-semibold md:text-4xl">Featured Bikes</h2>
          <p className="mt-2 text-foreground/60">Hand-picked rides ready for your next trip.</p>
        </div>
        <Link href="/explore-bikes" className="hidden text-sm font-medium text-accent-text md:inline">
          Explore all bikes →
        </Link>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {bikes.map((bike, index) => (
          <Reveal key={bike.id} delay={index * 0.05}>
            <BikeCard bike={bike} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
