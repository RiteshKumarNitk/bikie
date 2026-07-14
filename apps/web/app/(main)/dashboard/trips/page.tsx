import type { Metadata } from "next";
import Link from "next/link";
import type { RideStatsDTO, TripSummaryDTO } from "@bikie/types";
import { getJson } from "@/lib/api";
import { TripCard } from "@/components/trips/TripCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "My Rides" };

type TabType = "UPCOMING" | "ORGANIZING" | "JOINED" | "PENDING_APPROVAL" | "COMPLETED" | "CANCELLED";

export default async function DashboardTripsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const { organized, joined, requested, stats } = await getJson<{
    organized: TripSummaryDTO[];
    joined: TripSummaryDTO[];
    requested: TripSummaryDTO[];
    stats: RideStatsDTO;
  }>("/api/trips/mine", { auth: true });

  const activeTab: TabType = (searchParams.tab?.toUpperCase() as TabType) || "UPCOMING";

  const tabs = [
    { id: "UPCOMING", label: "Upcoming" },
    { id: "ORGANIZING", label: "Organizing" },
    { id: "JOINED", label: "Joined" },
    { id: "PENDING_APPROVAL", label: "Pending Approval" },
    { id: "COMPLETED", label: "Completed" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  let displayTrips: TripSummaryDTO[] = [];
  
  if (activeTab === "UPCOMING") {
    displayTrips = [...organized, ...joined].filter(t => t.status === "UPCOMING" || t.status === "PUBLISHED" || t.status === "IN_PROGRESS");
    // Remove duplicates if any
    displayTrips = Array.from(new Map(displayTrips.map(item => [item.id, item])).values());
  } else if (activeTab === "ORGANIZING") {
    displayTrips = organized;
  } else if (activeTab === "JOINED") {
    displayTrips = joined;
  } else if (activeTab === "PENDING_APPROVAL") {
    displayTrips = requested;
  } else if (activeTab === "COMPLETED") {
    displayTrips = [...organized, ...joined].filter(t => t.status === "COMPLETED");
  } else if (activeTab === "CANCELLED") {
    displayTrips = [...organized, ...joined].filter(t => t.status === "CANCELLED");
  }

  // Deduplicate and sort by date
  displayTrips = Array.from(new Map(displayTrips.map(item => [item.id, item])).values());
  displayTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">My Rides</h1>
        <Link
          href="/trips/create"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
        >
          + Create a Ride
        </Link>
      </div>

      <div className="mt-8 border-b border-foreground/10 pb-0 flex overflow-x-auto gap-6 hide-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/trips?tab=${tab.id.toLowerCase()}`}
            className={`pb-3 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent-text"
                : "border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <section className="mt-8">
        {displayTrips.length === 0 ? (
          <div className="mt-4">
            <EmptyState 
              title={`No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} rides`} 
              actionHref={activeTab === "ORGANIZING" ? "/trips/create" : "/trips"} 
              actionLabel={activeTab === "ORGANIZING" ? "+ Create a Ride" : "Browse rides"} 
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
