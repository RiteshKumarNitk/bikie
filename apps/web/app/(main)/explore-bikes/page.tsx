import type { Metadata } from "next";
import type { BikeSearchResultDTO, CategoryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BikeCard } from "@/components/shared/BikeCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { BikeFilters } from "@/components/explore/BikeFilters";

export const metadata: Metadata = {
  title: "Rent a Bike",
  description: "Search and filter premium motorcycles for rent across India — by location, category, price, and more.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(params: SearchParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) query.set(key, value);
  }
  return query.toString();
}

export default async function ExploreBikesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = toQueryString(params);

  const [{ bikes, total, page, pageSize }, { categories }] = await Promise.all([
    getJson<BikeSearchResultDTO>(`/api/bikes${query ? `?${query}` : ""}`),
    getJson<{ categories: CategoryDTO[] }>("/api/categories"),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const flatParams: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Rent a Bike" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Rent a Bike</h1>
        <p className="mt-2 text-foreground/60">{total} bikes ready for instant booking.</p>

        <div className="mt-8">
          <BikeFilters categories={categories} />
        </div>

        {bikes.length === 0 ? (
          <div className="mt-16">
            <EmptyState
              icon="🏍️"
              title="No bikes match those filters"
              description="Try widening your price range or clearing a filter."
              actionHref="/explore-bikes"
              actionLabel="Clear filters"
            />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bikes.map((bike) => (
              <BikeCard key={bike.id} bike={bike} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} basePath="/explore-bikes" searchParams={flatParams} />
      </div>
    </div>
  );
}
