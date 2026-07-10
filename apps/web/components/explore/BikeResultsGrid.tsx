import Link from "next/link";
import type { BikeSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { BikeCard } from "@/components/shared/BikeCard";
import { EmptyState } from "@/components/shared/EmptyState";

export async function BikeResultsGrid({ query }: { query: string }) {
  const { bikes, total } = await getJson<{ bikes: BikeSummaryDTO[]; total: number }>(`/api/bikes?${query}`);

  if (bikes.length === 0) {
    return (
      <EmptyState
        icon="🏍️"
        title="No bikes match right now"
        description="Explore the full catalog instead."
        actionHref="/explore-bikes"
        actionLabel="Explore all bikes"
      />
    );
  }

  return (
    <>
      <p className="text-sm text-foreground/60">{total} bikes found</p>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {bikes.map((bike) => (
          <BikeCard key={bike.id} bike={bike} />
        ))}
      </div>
      <Link href="/explore-bikes" className="mt-8 inline-flex text-sm font-medium text-accent-text">
        See all bikes with more filters →
      </Link>
    </>
  );
}
