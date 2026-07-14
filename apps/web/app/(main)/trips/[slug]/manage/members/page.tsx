import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { getJson } from "@/lib/api";
import { TripDetailDTO } from "@bikie/types";
import Link from "next/link";

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { trip } = await getJson<{ trip: TripDetailDTO }>(`/api/trips/${slug}`);
  if (!trip) notFound();

  // In a real implementation, you would fetch actual members
  // For now we just show a placeholder based on seatsTotal and seatsLeft
  const memberCount = trip.seatsTotal - trip.seatsLeft + 1; // +1 for the Organizer

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Manage Members</h2>
      <div className="rounded-3xl bg-card border border-foreground/10 p-6">
        <p className="text-sm text-foreground/60 mb-6">There are currently {memberCount} members out of {trip.seatsTotal} total seats.</p>
        
        {memberCount > 0 ? (
          <div className="space-y-4">
            {/* Organizer */}
            <div className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-foreground/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center font-bold">
                  {trip.organizer.image ? (
                    <img src={trip.organizer.image} alt={trip.organizer.name} className="w-full h-full object-cover" />
                  ) : (
                    trip.organizer.name[0]
                  )}
                </div>
                <div>
                  <p className="font-semibold">{trip.organizer.name} <span className="text-xs bg-accent text-background px-2 py-0.5 rounded-full ml-2">Organizer</span></p>
                  <p className="text-xs text-foreground/60">No vehicle info</p>
                </div>
              </div>
            </div>
            
            {/* Approved Participants */}
            {trip.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-transparent rounded-2xl border border-foreground/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center font-bold">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name[0]
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-foreground/60">No vehicle info</p>
                  </div>
                </div>
                <button className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-foreground/50">No members have joined yet.</p>
            <Link href={`/dashboard/requests`} className="inline-block mt-4 text-accent font-medium hover:underline">
              Check Pending Requests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
