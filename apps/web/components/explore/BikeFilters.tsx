"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import type { CategoryDTO } from "@bikie/types";

export function BikeFilters({ categories }: { categories: CategoryDTO[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "");
  const [instantOnly, setInstantOnly] = useState(searchParams.get("instantBooking") === "true");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "");

  function applyFilters(overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams();
    const next = {
      location,
      category,
      priceMax,
      instantBooking: instantOnly ? "true" : "",
      sort,
      ...overrides,
    };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] md:flex-row md:items-end md:gap-3">
      <div className="flex-1">
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or destination"
          className="mt-1 w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">Max Price / day</label>
        <input
          type="number"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          placeholder="Any"
          className="mt-1 w-28 rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-foreground/60">Sort</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-1 rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
        >
          <option value="">Recommended</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={instantOnly}
          onChange={(e) => setInstantOnly(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        Instant Booking
      </label>

      <button
        type="button"
        onClick={() => applyFilters()}
        className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
      >
        Apply
      </button>
    </div>
  );
}
