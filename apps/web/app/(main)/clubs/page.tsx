import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getServerSession } from "@/lib/get-session";

export const metadata: Metadata = {
  title: "Clubs",
  description: "Find and connect with rider clubs on BIKIE.",
};

const clubs = [
  { name: "Deccan Riders", city: "Bangalore", members: 214 },
  { name: "Himalayan Wanderers", city: "Manali", members: 187 },
  { name: "Coastal Cruisers Club", city: "Goa", members: 132 },
  { name: "Desert Storm MC", city: "Jaipur", members: 96 },
];

export default async function ClubsPage() {
  const session = await getServerSession();
  const createClubHref = session ? "/clubs" : "/login?next=/clubs";

  return (
    <div className="pb-24">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Clubs" }]} />

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">Clubs</h1>
            <p className="mt-2 max-w-xl text-foreground/60">
              Ride crews organized around a city, a bike, or a shared route.
            </p>
          </div>
          <Link
            href={createClubHref}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
          >
            + Create Club
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clubs.map((club) => (
            <div key={club.name} className="rounded-3xl bg-card p-6">
              <p className="font-semibold">{club.name}</p>
              <p className="mt-2 text-sm text-foreground/60">
                {club.city} · {club.members} members
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-secondary p-8 text-white">
          <p className="text-lg font-semibold">Club creation is coming soon</p>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            We&apos;re building tools for clubs to organize their own rides and manage
            membership. In the meantime, browse{" "}
            <Link href="/trips" className="underline">
              community rides
            </Link>{" "}
            to ride with these crews.
          </p>
        </div>
      </div>
    </div>
  );
}
