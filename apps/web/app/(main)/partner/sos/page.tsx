"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { PartnerAvailabilityToggle } from "@/components/partner/PartnerAvailabilityToggle";
import { MembershipRequiredNotice } from "@/components/partner/PartnerMembershipStatus";

interface PartnerSosStats {
  activeRequests: number;
  todayAssistanceCount: number;
  completedCount: number;
  ratingAvg: number;
  ratingCount: number;
}

interface PartnerNearbyRequest {
  id: string;
  type: string;
  severity: string;
  city: string;
  distanceMeters: number;
  createdAt: string;
}

interface PartnerActiveSession {
  id: string;
  alertId: string;
  status: string;
  riderName: string;
  alertType: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
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

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

/** ADR-045 — the web equivalent of mobile's PartnerHomeScreen (ADR-044). Reuses the existing
 * `/api/partner/sos/*` routes as-is — no new backend for this page. */
export default function PartnerSosDashboardPage() {
  const [stats, setStats] = useState<PartnerSosStats | null>(null);
  const [nearby, setNearby] = useState<PartnerNearbyRequest[] | null>(null);
  const [active, setActive] = useState<PartnerActiveSession[] | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  // ADR-056 — every `/api/partner/sos/*` route here is capability-gated (membership required).
  // Without this, a non-member saw "No open requests near you right now" / "You're not assisting
  // anyone right now" — indistinguishable from a genuinely idle, fully-active provider, when the
  // real reason was a 403 the page silently swallowed via `data.requests ?? []`.
  const [membershipRequired, setMembershipRequired] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocationError("Couldn't get your location. Distance-sorted requests need it."),
    );
  }, []);

  useEffect(() => {
    const query = location ? `?lat=${location.latitude}&lng=${location.longitude}` : "";
    fetch(`/api/partner/sos/dashboard${query}`).then(async (r) => {
      if (r.ok) setStats((await r.json()).stats);
      else if (r.status === 403) setMembershipRequired(true);
    });
    fetch("/api/partner/sos/active").then(async (r) => {
      setActive(r.ok ? ((await r.json()).sessions ?? []) : []);
    });
  }, [location]);

  useEffect(() => {
    if (!location) return;
    fetch(`/api/partner/sos/nearby?lat=${location.latitude}&lng=${location.longitude}`).then(async (r) => {
      setNearby(r.ok ? ((await r.json()).requests ?? []) : []);
    });
  }, [location]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">SOS Emergency</h1>
      <p className="mt-1 text-foreground/60">Emergency assistance requests near you.</p>

      <div className="mt-6">
        <PartnerAvailabilityToggle />
      </div>

      <MembershipRequiredNotice feature="SOS assistance" />

      {locationError && (
        <p className="mt-3 text-sm text-foreground/50">{locationError}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="🚨 Active Requests" value={stats?.activeRequests ?? "—"} />
        <StatCard label="Today's Assistance" value={stats?.todayAssistanceCount ?? "—"} />
        <StatCard label="Completed" value={stats?.completedCount ?? "—"} />
        <StatCard
          label="Rating"
          value={stats && stats.ratingCount > 0 ? `★ ${stats.ratingAvg.toFixed(1)}` : "No ratings yet"}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Nearby Requests</h2>
      </div>
      <div className="mt-3 space-y-3">
        {membershipRequired ? (
          <p className="text-sm text-foreground/40">Activate your membership above to see nearby requests.</p>
        ) : nearby === null ? (
          <p className="text-sm text-foreground/40">
            {location ? "Loading…" : "Share your location to see nearby requests."}
          </p>
        ) : nearby.length === 0 ? (
          <p className="text-sm text-foreground/40">No open requests near you right now.</p>
        ) : (
          nearby.map((r) => (
            <div key={r.id} className="rounded-2xl border border-foreground/10 bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {r.severity === "EMERGENCY" && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                        🔴 HIGH PRIORITY
                      </span>
                    )}
                    <span className="text-sm font-semibold">{TYPE_LABEL[r.type] ?? r.type}</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/60">
                    {formatDistance(r.distanceMeters)} · {r.city}
                  </p>
                </div>
                <Link
                  href={`/partner/sos/${r.id}`}
                  className="shrink-0 rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                >
                  View
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Active Assistance</h2>
      </div>
      <div className="mt-3 space-y-3">
        {membershipRequired ? (
          <p className="text-sm text-foreground/40">Activate your membership above to accept assistance requests.</p>
        ) : active === null ? (
          <p className="text-sm text-foreground/40">Loading…</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-foreground/40">You&apos;re not assisting anyone right now.</p>
        ) : (
          active.map((s) => (
            <div key={s.id} className="rounded-2xl border border-foreground/10 bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {s.riderName} → {TYPE_LABEL[s.alertType] ?? s.alertType}
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">
                    {s.etaMinutes != null ? `ETA ~${s.etaMinutes} min` : s.status}
                  </p>
                </div>
                <Link
                  href={`/partner/sos/${s.alertId}`}
                  className="shrink-0 rounded-lg border border-foreground/15 px-4 py-1.5 text-xs font-medium hover:bg-foreground/5"
                >
                  Open
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
