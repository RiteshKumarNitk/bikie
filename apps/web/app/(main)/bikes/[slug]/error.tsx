"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BikeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl">🏍️</p>
      <h2 className="text-xl font-semibold">Couldn&apos;t load this bike</h2>
      <p className="max-w-sm text-sm text-foreground/60">
        Something went wrong fetching this listing. Try again, or explore other bikes.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          Try again
        </button>
        <Link
          href="/explore-bikes"
          className="rounded-full border border-foreground/15 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5"
        >
          Explore Bikes
        </Link>
      </div>
    </div>
  );
}
