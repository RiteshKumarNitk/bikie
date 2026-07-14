"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { ReportModal } from "@/components/shared/ReportModal";

interface MyRequestStatus {
  status: string;
  message: string | null;
}

interface RideRequest {
  id: string;
  message: string | null;
  createdAt: string;
  rider: { id: string; name: string; image: string | null };
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function GroupChatLink({ tripSlug }: { tripSlug: string }) {
  const [conversationId, setConversationId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetchJson(`/api/trips/${tripSlug}/group`).then((data) => setConversationId(data?.conversationId ?? null));
  }, [tripSlug]);

  if (!conversationId) return null;

  return (
    <Link
      href={`/dashboard/messages?conversation=${conversationId}`}
      className="mt-3 block w-full rounded-xl border border-accent px-6 py-3 text-center text-sm font-semibold text-accent-text hover:bg-accent/10"
    >
      Open Ride Group
    </Link>
  );
}

function ReportRideLink({ tripId }: { tripId: string }) {
  const [reporting, setReporting] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setReporting(true)}
        className="mt-3 w-full text-center text-xs text-foreground/40 hover:text-foreground/70 hover:underline"
      >
        Report this ride
      </button>
      {reporting && (
        <ReportModal targetType="TRIP" targetId={tripId} title="Report this ride" onClose={() => setReporting(false)} />
      )}
    </>
  );
}

function RiderPanel({ tripSlug, tripId, seatsLeft }: { tripSlug: string; tripId: string; seatsLeft: number }) {
  const [request, setRequest] = useState<MyRequestStatus | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    fetchJson(`/api/trips/${tripSlug}/requests/mine`).then((data) => setRequest(data?.request ?? null));
  }

  useEffect(reload, [tripSlug]);

  async function requestToJoin() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripSlug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Couldn't send your request.");
        return;
      }
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelRequest() {
    setIsSubmitting(true);
    try {
      await fetch(`/api/trips/${tripSlug}/leave`, { method: "POST" });
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (request === undefined) {
    return <div className="mt-5 h-12 animate-pulse rounded-xl bg-foreground/5" />;
  }

  if (request?.status === "APPROVED") {
    return (
      <div className="mt-5">
        <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
          You&apos;re approved for this ride 🎉
        </p>
        <GroupChatLink tripSlug={tripSlug} />
        <button
          type="button"
          onClick={cancelRequest}
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl px-6 py-2 text-xs text-foreground/50 hover:text-foreground disabled:opacity-50"
        >
          Leave this ride
        </button>
        <ReportRideLink tripId={tripId} />
      </div>
    );
  }

  if (request?.status === "PENDING") {
    return (
      <div className="mt-5">
        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent-text">
          Request sent — waiting on the organizer to approve.
        </p>
        <button
          type="button"
          onClick={cancelRequest}
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl border border-foreground/10 px-6 py-2.5 text-sm hover:bg-foreground/5 disabled:opacity-50"
        >
          Cancel request
        </button>
        <ReportRideLink tripId={tripId} />
      </div>
    );
  }

  return (
    <div className="mt-5">
      {request?.status === "REJECTED" && (
        <p className="mb-3 text-xs text-foreground/50">
          Your previous request wasn&apos;t approved. You can send a new one.
        </p>
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Experience, bike, anything the organizer should know…"
        rows={3}
        className="w-full rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={requestToJoin}
        disabled={isSubmitting || seatsLeft <= 0}
        className="mt-3 w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {seatsLeft > 0 ? "Request to Join" : "Fully Booked"}
      </button>
      <ReportRideLink tripId={tripId} />
    </div>
  );
}

function OrganizerPanel({ tripSlug }: { tripSlug: string }) {
  const [requests, setRequests] = useState<RideRequest[] | undefined>(undefined);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  function reload() {
    fetchJson(`/api/trips/${tripSlug}/requests`).then((data) => setRequests(data?.requests ?? []));
  }

  useEffect(reload, [tripSlug]);

  async function decide(requestId: string, decision: "approve" | "reject") {
    setDecidingId(requestId);
    try {
      await fetch(`/api/trips/${tripSlug}/requests/${requestId}/${decision}`, { method: "POST" });
      reload();
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="mt-5">
      <Link
        href={`/trips/${tripSlug}/edit`}
        className="block w-full mb-3 rounded-xl border border-foreground/10 bg-transparent px-6 py-3 text-center text-sm font-semibold hover:bg-foreground/5"
      >
        Edit Ride
      </Link>
      <GroupChatLink tripSlug={tripSlug} />
      <p className="mt-4 text-sm font-medium">Join Requests</p>
      {requests === undefined ? (
        <div className="mt-2 h-16 animate-pulse rounded-xl bg-foreground/5" />
      ) : requests.length === 0 ? (
        <p className="mt-2 text-sm text-foreground/50">No pending requests yet.</p>
      ) : (
        <div className="mt-2 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-foreground/10 p-3">
              <p className="text-sm font-medium">{r.rider.name}</p>
              {r.message && <p className="mt-1 text-xs text-foreground/60">{r.message}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => decide(r.id, "approve")}
                  disabled={decidingId === r.id}
                  className="flex-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(r.id, "reject")}
                  disabled={decidingId === r.id}
                  className="flex-1 rounded-lg border border-foreground/10 px-3 py-1.5 text-xs hover:bg-foreground/5 disabled:opacity-50"
                >
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

export function RideActionsPanel({
  tripSlug,
  tripId,
  organizerId,
  seatsLeft,
}: {
  tripSlug: string;
  tripId: string;
  organizerId: string;
  seatsLeft: number;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="mt-5 h-12 animate-pulse rounded-xl bg-foreground/5" />;
  }

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/login?next=/trips/${tripSlug}`)}
        className="mt-5 w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90"
      >
        Sign in to request a spot
      </button>
    );
  }

  if (session.user.id === organizerId) {
    return <OrganizerPanel tripSlug={tripSlug} />;
  }

  return <RiderPanel tripSlug={tripSlug} tripId={tripId} seatsLeft={seatsLeft} />;
}
