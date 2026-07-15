"use client";

import { useEffect, useState } from "react";
import { RideJoinRequestDTO } from "@bikie/types";
import { Skeleton } from "@bikie/ui";

const REASON_MESSAGES: Record<string, string> = {
  NOT_FOUND: "This request no longer exists.",
  FORBIDDEN: "You're not the organizer of this ride.",
  NO_SEATS: "No seats left on this ride.",
};

export default function DashboardRequestsPage() {
  const [requests, setRequests] = useState<RideJoinRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/requests/pending")
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setLoading(false);
      });
  }, []);

  async function decide(requestId: string, tripSlug: string, action: "approve" | "reject") {
    setActionError(null);
    const res = await fetch(`/api/trips/${tripSlug}/requests/${requestId}/${action}`, {
      method: "POST",
    });
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return;
    }
    const data = await res.json().catch(() => null);
    setActionError(REASON_MESSAGES[data?.error] ?? "Something went wrong — please try again.");
  }

  const handleApprove = (requestId: string, tripSlug: string) => decide(requestId, tripSlug, "approve");
  const handleReject = (requestId: string, tripSlug: string) => decide(requestId, tripSlug, "reject");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Join Requests</h1>
      <p className="text-foreground/60 text-sm">Manage who joins your rides.</p>

      {actionError && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="shrink-0 font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-3xl" />
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
