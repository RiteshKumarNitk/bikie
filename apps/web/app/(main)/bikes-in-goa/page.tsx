import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeResultsGrid } from "@/components/explore/BikeResultsGrid";

export const metadata: Metadata = {
  title: "Motorcycle Rentals in Goa",
  description: "Rent scooters and bikes in Goa for easy coastal rides — instant booking on BIKIE.",
};

export default function BikesInGoaPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bikes in Goa" }]} />
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Motorcycle Rentals in Goa</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          Coastal highways, beach shacks, and easy scooter weekends — find your ride in Goa.
        </p>
        <div className="mt-10">
          <BikeResultsGrid query="location=Goa" />
        </div>
      </div>
    </div>
  );
}
