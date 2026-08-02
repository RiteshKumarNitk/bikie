import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-8xl font-semibold text-accent-text">404</p>
      <h1 className="text-2xl font-semibold">This road doesn&apos;t exist</h1>
      <p className="max-w-sm text-foreground/60">
        The page you&apos;re looking for took a wrong turn. Let&apos;s get you back on route.
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/" className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90">
          Back to Home
        </Link>
        <Link
          href="/explore-bikes"
          className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium hover:bg-foreground/5"
        >
          Rent a Bike
        </Link>
      </div>
    </div>
  );
}
