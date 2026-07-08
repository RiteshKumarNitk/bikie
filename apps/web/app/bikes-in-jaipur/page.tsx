import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeResultsGrid } from "@/components/explore/BikeResultsGrid";

export const metadata: Metadata = {
  title: "Motorcycle Rentals in Jaipur",
  description: "Rent premium motorcycles in Jaipur — Royal Enfields, cruisers, and adventure bikes with instant booking on BIKIE.",
};

export default function BikesInJaipurPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bikes in Jaipur" }]} />
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Motorcycle Rentals in Jaipur</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          From city cruisers to long-haul tourers, find your next ride in the Pink City.
        </p>
        <div className="mt-10">
          <BikeResultsGrid query="location=Jaipur" />
        </div>
      </div>
    </div>
  );
}
