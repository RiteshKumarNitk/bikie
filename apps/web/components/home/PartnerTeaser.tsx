import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";

export function PartnerTeaser() {
  return (
    <section id="partner" className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <div className="rounded-3xl bg-secondary px-8 py-16 text-center text-white md:px-16">
          <h2 className="text-3xl font-semibold md:text-4xl">Lead a Trip on BIKIE</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Are you an experienced rider? Become a trip organizer, guide fellow enthusiasts, and earn while you ride.
          </p>
          <Link
            href="/trips/create"
            className="mt-8 inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Create a Ride
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
