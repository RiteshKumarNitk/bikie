import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeResultsGrid } from "@/components/explore/BikeResultsGrid";

export const metadata: Metadata = {
  title: "Royal Enfield Rentals",
  description: "Rent a Royal Enfield anywhere in India — Classic, Himalayan, Meteor, and Interceptor, with instant booking on BIKIE.",
};

export default function RoyalEnfieldRentalsPage() {
  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Royal Enfield Rentals" }]} />
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Royal Enfield Rentals</h1>
        <p className="mt-2 max-w-xl text-foreground/60">
          India&apos;s most iconic motorcycle brand, ready to rent across every major destination.
        </p>
        <div className="mt-10">
          <BikeResultsGrid query="category=royal-enfield" />
        </div>
      </div>
    </div>
  );
}
