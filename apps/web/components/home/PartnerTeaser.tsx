import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";

export function PartnerTeaser() {
  return (
    <section id="partner" className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <div className="rounded-3xl bg-secondary px-8 py-16 text-center text-white md:px-16">
          <h2 className="text-3xl font-semibold md:text-4xl">List Your Bike on BIKIE</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Turn your fleet into a source of income. Partner mode unlocks bookings, analytics, and
            payouts — all from one dashboard.
          </p>
          <Link
            href="/partner"
            className="mt-8 inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Become a Partner
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
