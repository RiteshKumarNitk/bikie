import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { TripDetailDTO } from "@bikie/types";

export default async function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
  if (!trip) notFound();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Ride Timeline</h2>
      <div className="rounded-3xl bg-card border border-foreground/10 p-8">
        <div className="relative border-l-2 border-foreground/10 ml-4 space-y-8 py-2">
          
          <div className="relative pl-8">
              <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-background bg-accent" />
              <p className="text-base font-semibold text-accent-text">Ride Published</p>
              <p className="text-sm text-foreground/60 mt-1">By {trip.organizer.name}</p>
          </div>
          
          {trip.status !== "DRAFT" && trip.status !== "PUBLISHED" && (
            <div className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-background bg-accent" />
                <p className="text-base font-semibold text-accent-text">Status Updated: {trip.status}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
