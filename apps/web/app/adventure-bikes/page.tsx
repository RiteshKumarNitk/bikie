import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeResultsGrid } from "@/components/explore/BikeResultsGrid";

export const metadata: Metadata = {
  title: "Adventure Bikes",
  description: "Rent adventure motorcycles built for mountain passes and off-road trails — instant booking on BIKIE.",
};

export default function AdventureBikesPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Adventure Bikes" }]} />
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Adventure Bikes</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          Built for mountain passes, broken roads, and long-distance touring.
        </p>
        <div className="mt-10">
          <BikeResultsGrid query="category=adventure" />
        </div>
      </div>
    </div>
  );
}
