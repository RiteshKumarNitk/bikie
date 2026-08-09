"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@bikie/ui";
import { SOSTimeline, type TimelineEvent } from "@/components/sos/SOSTimeline";
import { SOSSessionChat } from "@/components/sos/SOSSessionChat";
import { PartnersMap } from "@/components/shared/PartnersMap";

interface Alert {
  id: string;
  userId: string;
  userName: string;
  // ADR-045 — null unless the viewer is the reporter, the assigned helper, or an admin.
  userPhone: string | null;
  userEmail: string | null;
  type: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string;
  status: string;
  severity: string;
  escalationTier: string;
  currentRadiusMeters: number;
  assignedHelperId: string | null;
  createdAt: string;
  placeName: string | null;
  area: string | null;
  formattedAddress: string | null;
}

interface Offer {
  id: string;
  responderId: string;
  responderName: string;
  responderPhone: string | null;
  status: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
  message: string | null;
  createdAt: string;
}

interface SessionDetail {
  id: string;
  status: string;
  conversationId: string | null;
  rating: number | null;
  helper: { id: string; name: string; phone: string | null; email: string };
  rider: { id: string; name: string; phone: string | null; email: string };
}

interface Partner {
  userId: string;
  businessName: string;
  user: { name: string; phone: string | null };
  contactPerson1Mobile: string | null;
  latitude: number | null;
  longitude: number | null;
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
  NOT_FOUND: "This alert could not be found.",
  FORBIDDEN: "You don't have permission to do that.",
  ALREADY_ASSIGNED: "Someone else already accepted a helper for this alert.",
  ALREADY_OFFERED: "You've already offered to help with this alert.",
  OFFER_NOT_AVAILABLE: "That offer is no longer available.",
  ALERT_NOT_ACTIVE: "This alert is no longer active.",
  SESSION_NOT_COMPLETED: "The session isn't marked complete yet.",
  ALREADY_RATED: "You've already rated this session.",
  INVALID_RATING: "Pick a rating between 1 and 5.",
};

function friendlyError(code: unknown): string {
  if (typeof code === "string" && ERROR_LABEL[code]) return ERROR_LABEL[code];
  return "Something went wrong. Please try again.";
}

function mapsNavigateUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function SOSAlertDetailPage() {
  const params = useParams<{ id: string }>();
  const alertId = params.id;
  const { data: authSession } = authClient.useSession();

  const [alert, setAlert] = useState<Alert | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [sosSession, setSosSession] = useState<SessionDetail | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myOfferId, setMyOfferId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const userId = authSession?.user.id;
  const isAdmin = authSession?.user.role === "ADMIN";
  const isReporter = alert?.userId === userId;
  const isAssignedHelper = alert?.assignedHelperId === userId;

  const load = useCallback(async () => {
    const res = await fetch(`/api/sos/alerts/${alertId}`);
    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAlert(data.alert);
    setTimeline(data.timeline ?? []);
    setSosSession(data.session ?? null);
    setLoading(false);
  }, [alertId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!alert || !(isReporter || isAdmin) || alert.assignedHelperId) return;
    fetch(`/api/sos/alerts/${alertId}/offers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setOffers(d.offers);
      });
  }, [alert, isReporter, isAdmin, alertId]);

  async function handleOffer() {
    setBusy(true);
    setActionError(null);
    try {
      const location = await new Promise<{ latitude: number; longitude: number } | undefined>((resolve) => {
        if (!navigator.geolocation) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(undefined),
        );
      });
      const res = await fetch(`/api/sos/alerts/${alertId}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location ?? {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(friendlyError(data.error));
        return;
      }
      setMyOfferId(data.offer.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!myOfferId) return;
    setBusy(true);
    try {
      await fetch(`/api/sos/alerts/${alertId}/offers/${myOfferId}/withdraw`, { method: "POST" });
      setMyOfferId(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(offerId: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sos/alerts/${alertId}/offers/${offerId}/accept`, { method: "POST" });
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

  async function handleReject(offerId: string) {
    setBusy(true);
    try {
      await fetch(`/api/sos/alerts/${alertId}/offers/${offerId}/reject`, { method: "POST" });
      setOffers((prev) => prev?.map((o) => (o.id === offerId ? { ...o, status: "REJECTED" } : o)) ?? null);
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

  async function handleRate() {
    if (!sosSession) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/sos/sessions/${sosSession.id}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: ratingValue, comment: ratingComment.trim() || undefined }),
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

  async function loadPartners(type?: string) {
    if (!alert) return;
    const url = `/api/sos/partners?city=${encodeURIComponent(alert.city)}${type ? `&type=${type}` : ""}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({ partners: [] }));
    setPartners(data.partners ?? []);
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
        <p className="font-semibold">Alert not found</p>
        <Link href="/dashboard/sos" className="mt-3 inline-block text-sm text-accent-text hover:underline">
          ← Back to SOS Dashboard
        </Link>
      </div>
    );
  }

  const isOpen = !alert.assignedHelperId;
  const canOffer = isOpen && !isReporter && !isAdmin && !myOfferId;
  const canRate = sosSession?.status === "COMPLETED" && isReporter && sosSession.rating == null;

  return (
    <div>
      <Link href="/dashboard/sos" className="text-sm text-accent-text hover:underline">
        ← Back to SOS Dashboard
      </Link>

      <div className="mt-3 rounded-2xl border border-foreground/10 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                alert.severity === "EMERGENCY" ? "bg-red-500/15 text-red-400" : "bg-[#ffaa00]/15 text-[#ffaa00]"
              }`}
            >
              {alert.severity === "EMERGENCY" ? "🔴 Emergency" : "🟠 Assistance"}
            </span>
            <span className="text-sm font-semibold">{TYPE_LABEL[alert.type] ?? alert.type}</span>
          </div>
          <span className="rounded-full border border-foreground/10 px-2.5 py-1 text-xs text-foreground/60">
            {alert.status}
            {isOpen && ` · tier: ${alert.escalationTier} · ${alert.currentRadiusMeters / 1000}km`}
          </span>
        </div>

        <p className="mt-2 text-sm font-medium text-foreground/80">{alert.userName}</p>
        <div className="mt-1 space-y-0.5 text-sm text-foreground/50">
          {alert.formattedAddress || alert.placeName ? (
            <p>📍 {alert.formattedAddress ?? [alert.placeName, alert.area, alert.city].filter(Boolean).join(", ")}</p>
          ) : (
            <p>🏙️ {alert.city}</p>
          )}
          {alert.latitude != null && alert.longitude != null && (
            <p>
              <a
                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent-text hover:underline"
              >
                View on map
              </a>
            </p>
          )}
        </div>
        {alert.description && <p className="mt-2 text-sm text-foreground/70">{alert.description}</p>}
        <p className="mt-2 text-xs text-foreground/40">{new Date(alert.createdAt).toLocaleString("en-IN")}</p>

        {actionError && (
          <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{actionError}</div>
        )}

        {canOffer && (
          <button
            type="button"
            onClick={handleOffer}
            disabled={busy}
            className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Sending…" : "🏍️ I'm Coming"}
          </button>
        )}
        {isOpen && myOfferId && (
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={busy}
            className="mt-4 rounded-xl border border-foreground/15 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
          >
            Cannot Help — Withdraw Offer
          </button>
        )}
      </div>

      {/* Reporter/admin: review offers before a helper is assigned */}
      {isOpen && (isReporter || isAdmin) && (
        <div className="mt-4 rounded-2xl border border-foreground/10 bg-card p-6">
          <h2 className="font-semibold">Offers to help ({offers?.length ?? 0})</h2>
          {!offers || offers.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/40">No one has offered yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {offers.map((o) => (
                <div key={o.id} className="rounded-xl border border-foreground/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{o.responderName}</p>
                      <p className="text-xs text-foreground/50">
                        {o.distanceMeters != null ? `~${(o.distanceMeters / 1000).toFixed(1)}km away` : "distance unknown"}
                        {o.etaMinutes != null && ` · ETA ~${o.etaMinutes} min`}
                        {o.responderPhone && ` · ${o.responderPhone}`}
                      </p>
                      {o.message && <p className="mt-1 text-xs text-foreground/60">&ldquo;{o.message}&rdquo;</p>}
                    </div>
                    {o.status === "OFFERED" && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(o.id)}
                          disabled={busy}
                          className="rounded-lg bg-success/20 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/30 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(o.id)}
                          disabled={busy}
                          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {o.status !== "OFFERED" && (
                      <span className="shrink-0 text-xs text-foreground/40">{o.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matched: session panel */}
      {sosSession && (isAssignedHelper || isReporter || isAdmin) && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-foreground/10 bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {isAssignedHelper ? `Rider: ${sosSession.rider.name}` : `Helper: ${sosSession.helper.name}`}
              </h2>
              <span className="rounded-full border border-foreground/10 px-2.5 py-1 text-xs text-foreground/60">
                {sosSession.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(isAssignedHelper ? sosSession.rider.phone : sosSession.helper.phone) && (
                <a
                  href={`tel:${isAssignedHelper ? sosSession.rider.phone : sosSession.helper.phone}`}
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                >
                  📞 Call {isAssignedHelper ? "Rider" : "Helper"}
                </a>
              )}
              {/* alert.latitude/longitude are non-null here — this whole panel only renders for
                  a privileged viewer (assigned helper/reporter/admin), the same audience ADR-045
                  redaction never withholds coordinates from. */}
              <a
                href={mapsNavigateUrl(alert.latitude!, alert.longitude!)}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
              >
                🧭 Open Navigation
              </a>
              {isAssignedHelper && (
                <>
                  <button
                    type="button"
                    onClick={() => loadPartners("MECHANIC")}
                    className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                  >
                    🔧 Share Mechanic
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPartners("FUEL_DELIVERY")}
                    className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                  >
                    ⛽ Share Fuel Contact
                  </button>
                </>
              )}
            </div>

            {partners && (
              <div className="mt-3 space-y-3">
                {partners.length === 0 ? (
                  <p className="text-xs text-foreground/40">No matching partners found nearby.</p>
                ) : (
                  <>
                    {partners.some((p) => p.latitude != null && p.longitude != null) && (
                      <PartnersMap
                        pins={partners
                          .filter((p): p is Partner & { latitude: number; longitude: number } => p.latitude != null && p.longitude != null)
                          .map((p) => ({ id: p.userId, name: p.businessName, latitude: p.latitude, longitude: p.longitude }))}
                        center={{ latitude: alert.latitude!, longitude: alert.longitude! }}
                        height="12rem"
                      />
                    )}
                    <div className="space-y-2 rounded-xl border border-foreground/10 p-3">
                      {partners.map((p) => (
                        <p key={p.userId} className="text-xs text-foreground/70">
                          {p.businessName} — {p.user.phone ?? p.contactPerson1Mobile ?? "no phone on file"}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {isAssignedHelper && sosSession.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={() => handleSessionStatus("HELPER_ARRIVED")}
                  disabled={busy}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  Mark Arrived
                </button>
              )}
              {isAssignedHelper && sosSession.status === "HELPER_ARRIVED" && (
                <button
                  type="button"
                  onClick={() => handleSessionStatus("ASSISTANCE_IN_PROGRESS")}
                  disabled={busy}
                  className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  Start Assistance
                </button>
              )}
              {isReporter && sosSession.status === "ASSISTANCE_IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={() => handleSessionStatus("COMPLETED")}
                  disabled={busy}
                  className="rounded-lg bg-success/20 px-4 py-1.5 text-xs font-medium text-success hover:bg-success/30 disabled:opacity-50"
                >
                  Mark Complete
                </button>
              )}
              {(isAssignedHelper || isReporter || isAdmin) &&
                sosSession.status !== "COMPLETED" &&
                sosSession.status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => handleSessionStatus("CANCELLED")}
                    disabled={busy}
                    className="rounded-lg border border-foreground/15 px-4 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
            </div>

            {canRate && (
              <div className="mt-4 rounded-xl border border-foreground/10 p-4">
                <p className="text-sm font-medium">Rate your helper</p>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRatingValue(n)}
                      className={`text-xl ${n <= ratingValue ? "text-warning" : "text-foreground/20"}`}
                      aria-label={`${n} star`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Optional comment"
                  className="mt-2 w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleRate}
                  disabled={busy}
                  className="mt-2 rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  Submit Rating
                </button>
              </div>
            )}
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

      <div className="mt-4 rounded-2xl border border-foreground/10 bg-card p-6">
        <h2 className="font-semibold">Timeline</h2>
        <div className="mt-3">
          <SOSTimeline events={timeline} />
        </div>
      </div>
    </div>
  );
}
