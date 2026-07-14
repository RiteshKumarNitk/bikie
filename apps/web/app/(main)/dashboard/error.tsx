"use client";

import { useEffect } from "react";

export default function DashboardError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-foreground/10 bg-card px-6 py-16 text-center">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="max-w-sm text-sm text-foreground/60">
        We couldn&apos;t load this page. Try again, or head back to your dashboard overview.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
      >
        Try again
      </button>
    </div>
  );
}
