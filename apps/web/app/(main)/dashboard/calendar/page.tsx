"use client";

import { useEffect, useState } from "react";
import { TripSummaryDTO } from "@bikie/types";
import Link from "next/link";
import { Skeleton } from "@bikie/ui";

export default function DashboardCalendarPage() {
  const [rides, setRides] = useState<TripSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trips/mine")
      .then((res) => res.json())
      .then((data) => {
        const all = [...(data.organized || []), ...(data.joined || [])];
        all.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setRides(all);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <p className="text-foreground/60 text-sm">Your upcoming rides timeline.</p>

      {loading ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : rides.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-foreground/20 p-12 text-center text-foreground/50">
          No upcoming rides on your calendar.
        </div>
      ) : (
        <div className="relative border-l-2 border-foreground/10 ml-4 space-y-8 py-4">
          {rides.map(ride => {
            const date = new Date(ride.startDate);
            const isUpcoming = date > new Date();
            return (
              <div key={ride.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-background ${isUpcoming ? 'bg-accent' : 'bg-foreground/30'}`} />
                <p className="text-sm font-semibold text-accent-text">{date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                <Link href={`/trips/${ride.slug}`} className="block mt-2 rounded-2xl bg-card border border-foreground/10 p-4 hover:border-accent transition-colors">
                  <p className="font-semibold">{ride.title}</p>
                  <p className="text-sm text-foreground/60 mt-1">{ride.type} • {ride.destination?.name || "Multiple locations"}</p>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
