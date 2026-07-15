import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { RideJoinRequestDTO, TripDetailDTO } from "@bikie/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import Link from "next/link";
import { CopyRideLinkButton } from "@/components/trips/CopyRideLinkButton";

export default async function TripManagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
  if (!trip) notFound();

  const { requests: pendingRequests } = await getJson<{ requests: RideJoinRequestDTO[] }>(
    `/api/trips/${slug}/requests`,
    { auth: true },
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card p-5 border border-foreground/10">
          <p className="text-xs text-foreground/50 font-medium">Members</p>
          <p className="text-2xl font-bold mt-1">{trip.seatsTotal - trip.seatsLeft + 1}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 border border-foreground/10">
          <p className="text-xs text-foreground/50 font-medium">Pending Approvals</p>
          <p className="text-2xl font-bold mt-1 text-warning">{pendingRequests.length}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 border border-foreground/10">
          <p className="text-xs text-foreground/50 font-medium">Status</p>
          <p className="text-2xl font-bold mt-1 capitalize">{trip.status.toLowerCase().replace('_', ' ')}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 border border-foreground/10">
          <p className="text-xs text-foreground/50 font-medium">Total Collected</p>
          <p className="text-2xl font-bold mt-1">₹{(trip.seatsTotal - trip.seatsLeft) * trip.price}</p>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Invite Riders</h2>
        </div>
        <div className="rounded-3xl bg-card border border-foreground/10 p-6">
          <p className="text-sm text-foreground/60 mb-4">Share this ride&apos;s link so riders can find it and request to join.</p>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              readOnly
              value={`/trips/${trip.slug}`}
              className="flex-1 bg-background border border-foreground/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent"
            />
            <CopyRideLinkButton tripSlug={trip.slug} />
          </div>
        </div>
      </section>

      <section className="mt-10">
         <h2 className="text-xl font-semibold mb-4">Ride Timeline</h2>
         <div className="relative border-l-2 border-foreground/10 ml-4 space-y-6 py-2">
            <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-background bg-accent" />
                <p className="text-sm font-semibold text-accent-text">Ride Published</p>
                <p className="text-xs text-foreground/60 mt-1">By {trip.organizer.name}</p>
            </div>
         </div>
      </section>
    </div>
  );
}
