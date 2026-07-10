"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-8xl font-semibold text-accent-text">500</p>
      <h1 className="text-2xl font-semibold">Something stalled out</h1>
      <p className="max-w-sm text-foreground/60">
        An unexpected error occurred. Our team has been notified — try again in a moment.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium hover:bg-foreground/5"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
