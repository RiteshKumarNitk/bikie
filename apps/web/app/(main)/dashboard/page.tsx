"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardOverviewDTO, RideJoinRequestDTO } from "@bikie/types";
import { authClient } from "@/lib/auth-client";

export default function DashboardHomePage() {
  const { data: session } = authClient.useSession();
  const [overview, setOverview] = useState<DashboardOverviewDTO | null>(null);
  const [requests, setRequests] = useState<RideJoinRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/overview").then(res => res.json()),
      fetch("/api/requests/pending").then(res => res.json())
    ]).then(([overviewData, requestsData]) => {
      setOverview(overviewData);
      setRequests(requestsData.requests || []);
      setLoading(false);
    });
  }, []);

  async function handleApprove(requestId: string, tripSlug: string) {
    const res = await fetch(`/api/trips/${tripSlug}/requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "APPROVE" })
    });
    if (res.ok) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setOverview(prev => prev ? { ...prev, stats: { ...prev.stats, pendingRequests: prev.stats.pendingRequests - 1 } } : null);
    }
  }

  async function handleReject(requestId: string, tripSlug: string) {
    const res = await fetch(`/api/trips/${tripSlug}/requests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "REJECT" })
    });
    if (res.ok) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setOverview(prev => prev ? { ...prev, stats: { ...prev.stats, pendingRequests: prev.stats.pendingRequests - 1 } } : null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-card animate-pulse rounded-3xl" />
        <div className="h-64 bg-card animate-pulse rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">👋 Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {session?.user.name.split(" ")[0]}</h1>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-2xl bg-card border border-foreground/10 p-5 min-w[140px] flex-1">
            <p className="text-2xl font-bold">{overview?.stats.upcomingRides}</p>
            <p className="text-sm text-foreground/60 mt-1">Upcoming Rides</p>
          </div>
          <div className="rounded-2xl bg-card border border-foreground/10 p-5 min-w[140px] flex-1">
            <p className="text-2xl font-bold">{overview?.stats.pendingRequests}</p>
            <p className="text-sm text-foreground/60 mt-1">Pending Requests</p>
          </div>
          <div className="rounded-2xl bg-card border border-foreground/10 p-5 min-w[140px] flex-1">
            <p className="text-2xl font-bold">{overview?.stats.unreadMessages}</p>
            <p className="text-sm text-foreground/60 mt-1">Unread Messages</p>
          </div>
        </div>
      </div>

      {overview?.actionableItems && overview.actionableItems.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-red-400">Needs Your Attention</h2>
          <div className="grid gap-3">
            {overview.actionableItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  {item.description && <p className="text-sm opacity-70 mt-0.5">{item.description}</p>}
                </div>
                <Link href={item.actionHref} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors">
                  {item.actionLabel}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {requests.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pending Join Requests</h2>
            <Link href="/dashboard/requests" className="text-sm text-accent-text hover:underline">View all</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {requests.slice(0, 4).map(req => (
              <div key={req.id} className="rounded-2xl bg-card border border-foreground/10 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-foreground/10 shrink-0">
                      {req.rider.image ? <img src={req.rider.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{req.rider.name[0]}</div>}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{req.rider.name}</p>
                      <p className="text-xs text-foreground/60">{req.rider.bike || "Unknown bike"}</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-foreground/5 p-3 rounded-xl border border-foreground/10">
                    <p className="text-xs font-semibold mb-1 text-accent-text">Requested to join {req.tripTitle}</p>
                    {req.message && <p className="text-sm text-foreground/80 italic">&quot;{req.message}&quot;</p>}
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => handleApprove(req.id, req.tripSlug)} className="flex-1 bg-accent text-white py-2 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleReject(req.id, req.tripSlug)} className="flex-1 bg-foreground/10 py-2 rounded-xl text-sm font-semibold hover:bg-foreground/20 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/trips/create" className="px-5 py-3 rounded-2xl bg-card border border-foreground/10 text-sm font-medium hover:border-accent transition-colors flex items-center gap-2">
            <span className="text-lg">+</span> Create Ride
          </Link>
          <Link href="/dashboard/requests" className="px-5 py-3 rounded-2xl bg-card border border-foreground/10 text-sm font-medium hover:border-accent transition-colors">
            Manage Requests
          </Link>
          <Link href="/dashboard/messages" className="px-5 py-3 rounded-2xl bg-card border border-foreground/10 text-sm font-medium hover:border-accent transition-colors">
            Ride Rooms
          </Link>
        </div>
      </section>

    </div>
  );
}
