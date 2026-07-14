"use client";

import { useEffect, useState } from "react";
import { RideJoinRequestDTO } from "@bikie/types";

export default function DashboardRequestsPage() {
  const [requests, setRequests] = useState<RideJoinRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests/pending")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
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
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Join Requests</h1>
      <p className="text-foreground/60 text-sm">Manage who joins your rides.</p>

      {loading ? (
        <div className="h-64 bg-card animate-pulse rounded-3xl" />
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-foreground/20 p-12 text-center text-foreground/50">
          No pending requests.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map(req => (
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
      )}
    </div>
  );
}
