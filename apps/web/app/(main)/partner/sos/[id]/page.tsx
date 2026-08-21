"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@bikie/ui";
import { SOSSessionChat } from "@/components/sos/SOSSessionChat";

interface Alert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string | null;
  type: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string;
  status: string;
  severity: string;
  assignedHelperId: string | null;
  placeName: string | null;
  area: string | null;
  formattedAddress: string | null;
  riderVehicleType: string | null;
  riderVehicleBrand: string | null;
  riderVehicleModel: string | null;
  riderVehicleRegistrationNumber: string | null;
}

interface Offer {
  id: string;
  responderId: string;
  status: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
}

interface SessionDetail {
  id: string;
  status: string;
  conversationId: string | null;
  helper: { id: string; name: string; phone: string | null; email: string };
  rider: { id: string; name: string; phone: string | null; email: string };
}

const TYPE_LABEL: Record<string, string> = {
  ACCIDENT: "🚨 Accident",
  LIFE_THREATENING: "🔥 Life Threatening",
  MEDICAL: "🏥 Medical Emergency",
  BIKE_BREAKDOWN: "🔧 Bike Breakdown",
  FLAT_TYRE: "🔩 Flat Tyre",
  FUEL_EMPTY: "⛽ Fuel Required",
  BATTERY_ISSUE: "🔋 Battery Issue",
  LOST: "🗺️ Lost",
  OTHER: "❗ Other",
};

const ERROR_LABEL: Record<string, string> = {
  NOT_FOUND: "This request could not be found.",
  FORBIDDEN: "You don't have permission to do that.",
  ALREADY_ASSIGNED: "Someone else already accepted this request.",
  ALREADY_RESPONDED: "You've already responded to this request.",
  ALERT_NOT_ACTIVE: "This request is no longer active.",
  NOT_VERIFIED: "Your Service Provider profile is inactive or suspended.",
  PARTNER_OFFLINE: "You're offline — go available to respond.",
  CATEGORY_MISMATCH: "This request isn't in your service category.",
  AT_CAPACITY: "You're already assisting someone else.",
};

function friendlyError(code: unknown): string {
  if (typeof code === "string" && ERROR_LABEL[code]) return ERROR_LABEL[code];
  return "Something went wrong. Please try again.";
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

function describeLocation(alert: Alert): string {
  if (alert.formattedAddress) return alert.formattedAddress;
  const parts = [alert.placeName, alert.area, alert.city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : alert.city;
}

const STATUS_CHECKLIST: [string, string][] = [
  ["ACTIVE", "On the Way"],
  ["HELPER_ARRIVED", "Arrived"],
  ["ASSISTANCE_IN_PROGRESS", "Assistance Started"],
  ["COMPLETED", "Completed"],
];

/** ADR-045 — the web equivalent of mobile's PartnerSosRequestScreen (ADR-044). A separate page
 * from `/dashboard/sos/[id]`, not a modification of it — zero regression risk to the generic
 * rider-facing flow that page already serves. Same fix applied here as on mobile:
 * `GET /api/sos/alerts/[id]/offers` is reporter/admin-only, so "do I have a pending offer" is
 * tracked locally from the /offer response, not re-derived from that endpoint. */
export default function PartnerSosRequestPage() {
  const params = useParams<{ id: string }>();
  const alertId = params.id;
  const { data: authSession } = authClient.useSession();
  const userId = authSession?.user.id;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [sosSession, setSosSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myOffer, setMyOffer] = useState<Offer | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [membershipRequired, setMembershipRequired] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sos/alerts/${alertId}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAlert(data.alert);
    setSosSession(data.session ?? null);
    setLoading(false);
  }, [alertId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept() {
    setBusy(true);
    setActionError(null);
    setMembershipRequired(false);
    try {
      const res = await fetch(`/api/sos/alerts/${alertId}/offer`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "MEMBERSHIP_REQUIRED") {
          setMembershipRequired(true);
          setActionError(data.message ?? friendlyError(data.error));
        } else {
          setActionError(friendlyError(data.error));
        }
        return;
      }
      setMyOffer(data.offer);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sos/alerts/${alertId}/decline`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setActionError(friendlyError(data.error));
        return;
      }
      window.location.href = "/partner/sos";
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!myOffer) return;
    setBusy(true);
    try {
      await fetch(`/api/sos/alerts/${alertId}/offers/${myOffer.id}/withdraw`, { method: "POST" });
      setMyOffer(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleSessionStatus(status: string) {
    if (!sosSession) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sos/sessions/${sosSession.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(friendlyError(data.error));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="mt-4 h-40 rounded-2xl" />
      </div>
    );
  }

  if (notFound || !alert) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-card p-8 text-center">
        <p className="font-semibold">Request not found</p>
        <Link href="/partner/sos" className="mt-3 inline-block text-sm text-accent-text hover:underline">
          ← Back to SOS Emergency
        </Link>
      </div>
    );
  }

  const isAssignedHelper = alert.assignedHelperId === userId;
  const confirmed = sosSession != null && sosSession.helper.id === userId;
  const unavailable =
    !confirmed && ((alert.assignedHelperId != null && !isAssignedHelper) || alert.status !== "ACTIVE");
  const waitingForRider = !confirmed && !unavailable && myOffer != null;
  const needsResponse = !confirmed && !unavailable && myOffer == null;

  return (
    <div>
      <Link href="/partner/sos" className="text-sm text-accent-text hover:underline">
        ← Back to SOS Emergency
      </Link>

      {actionError && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{actionError}</span>
          {membershipRequired && (
            <Link href="/partner/membership" className="shrink-0 font-semibold underline">
              Subscribe
            </Link>
          )}
        </div>
      )}

      {needsResponse && (
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl border border-foreground/10 bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {alert.severity === "EMERGENCY" && (
                <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
                  🔴 HIGH PRIORITY
                </span>
              )}
            </div>
            <p className="mt-2 text-lg font-semibold">{TYPE_LABEL[alert.type] ?? alert.type}</p>
            <p className="mt-1 text-sm text-foreground/60">{describeLocation(alert)}</p>
            <p className="mt-3 text-sm font-medium text-foreground/80">{alert.userName}</p>
            {(alert.riderVehicleBrand || alert.riderVehicleType) && (
              <p className="text-sm text-foreground/50">
                {[alert.riderVehicleBrand, alert.riderVehicleModel, alert.riderVehicleType]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {alert.riderVehicleRegistrationNumber && (
              <p className="text-sm text-foreground/50">Reg. no: {alert.riderVehicleRegistrationNumber}</p>
            )}
            {alert.description && <p className="mt-2 text-sm text-foreground/70">{alert.description}</p>}
            {alert.latitude != null && alert.longitude != null && (
              <a
                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-accent-text hover:underline"
              >
                View Location
              </a>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDecline}
              disabled={busy}
              className="flex-1 rounded-xl border border-foreground/15 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
            >
              DECLINE
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={busy}
              className="flex-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {busy ? "Sending…" : "ACCEPT"}
            </button>
          </div>
        </div>
      )}

      {waitingForRider && myOffer && (
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl border border-foreground/10 bg-card p-6">
            <p className="text-lg font-semibold">Waiting for Rider Confirmation</p>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground/80">{alert.userName}</p>
            <p className="text-sm text-foreground/60">{TYPE_LABEL[alert.type] ?? alert.type}</p>
            {myOffer.distanceMeters != null && (
              <p className="text-sm text-foreground/60">{formatDistance(myOffer.distanceMeters)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={busy}
            className="rounded-xl border border-foreground/15 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Cancel Response"}
          </button>
        </div>
      )}

      {confirmed && sosSession && (
        <div className="mt-3 space-y-4">
          <div className="rounded-2xl border border-foreground/10 bg-card p-6">
            <p className="text-lg font-semibold">🟢 Assistance Confirmed</p>
            <p className="mt-3 text-sm font-medium text-foreground/80">Rider: {sosSession.rider.name}</p>
            <p className="text-sm text-foreground/60">{TYPE_LABEL[alert.type] ?? alert.type}</p>
            <p className="text-sm text-foreground/60">{describeLocation(alert)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {alert.latitude != null && alert.longitude != null && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                >
                  🧭 Navigate
                </a>
              )}
              {sosSession.rider.phone && (
                <a
                  href={`tel:${sosSession.rider.phone}`}
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                >
                  📞 Call Rider
                </a>
              )}
              {sosSession.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => handleSessionStatus("HELPER_ARRIVED")}
                  disabled={busy}
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-50"
                >
                  ✅ I&apos;ve Arrived
                </button>
              )}
              {sosSession.status === "HELPER_ARRIVED" && (
                <button
                  type="button"
                  onClick={() => handleSessionStatus("ASSISTANCE_IN_PROGRESS")}
                  disabled={busy}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  🔧 Start Assistance
                </button>
              )}
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium">Status</p>
              <div className="mt-2 space-y-1.5">
                <p className="text-sm text-success">✓ Request Accepted</p>
                <p className="text-sm text-success">✓ Rider Confirmed</p>
                {STATUS_CHECKLIST.map(([status, label], i) => {
                  const currentIndex = STATUS_CHECKLIST.findIndex(([s]) => s === sosSession.status);
                  const done = i < currentIndex || sosSession.status === "COMPLETED";
                  const current = i === currentIndex;
                  return (
                    <p
                      key={status}
                      className={`text-sm ${done ? "text-success" : current ? "text-accent-text" : "text-foreground/40"}`}
                    >
                      {done ? "✓" : current ? "●" : "○"} {label}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          {sosSession.conversationId && userId && (
            <SOSSessionChat
              conversationId={sosSession.conversationId}
              userId={userId}
              helper={sosSession.helper}
              rider={sosSession.rider}
            />
          )}
        </div>
      )}

      {unavailable && (
        <div className="mt-3 rounded-2xl border border-foreground/10 bg-card p-8 text-center">
          <p className="font-semibold">No longer available</p>
          <p className="mt-1 text-sm text-foreground/50">
            Another responder already has this request, or it has been closed.
          </p>
        </div>
      )}
    </div>
  );
}
