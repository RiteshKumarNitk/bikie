"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@bikie/ui";
import { EmptyState } from "@/components/shared/EmptyState";
import { PanicAlertCards } from "@/components/shared/PanicAlertCards";
import { NearbyHelpPanel } from "@/components/shared/NearbyHelpPanel";

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string;
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  city: string;
  status: string;
  severity: string;
  escalationTier: string;
  assignedHelperId: string | null;
  createdAt: string;
  placeName: string | null;
  area: string | null;
  formattedAddress: string | null;
}

const alertTypes = [
  { value: "ACCIDENT", label: "🚑 Accident", desc: "I've been in an accident" },
  { value: "LIFE_THREATENING", label: "🔥 Life Threatening", desc: "Life-threatening emergency" },
  { value: "BIKE_BREAKDOWN", label: "🔧 Bike Breakdown", desc: "My bike has broken down" },
  { value: "FLAT_TYRE", label: "🔩 Flat Tyre", desc: "I have a flat tyre" },
  { value: "FUEL_EMPTY", label: "⛽ Fuel Required", desc: "I've run out of fuel" },
  { value: "BATTERY_ISSUE", label: "🔋 Battery Issue", desc: "My battery has an issue" },
  { value: "MEDICAL", label: "🏥 Medical Emergency", desc: "I need medical help" },
  { value: "LOST", label: "🗺️ Lost", desc: "I'm lost and need directions" },
  { value: "OTHER", label: "❗ Other", desc: "Other emergency" },
];

function MembershipUpsell() {
  return (
    <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
        🆘
      </div>
      <h2 className="mt-4 text-lg font-semibold">SOS Emergency is a Membership perk</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50">
        Sending, viewing, and responding to SOS alerts is available to active BIKIE members only —
        this keeps the safety network trustworthy and limited to verified riders.
      </p>
      <Link
        href="/membership"
        className="mt-6 inline-flex rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        View Membership Plans
      </Link>
    </div>
  );
}

export default function SOSPage() {
  const { data: session } = authClient.useSession();
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "alerts" | "help">("new");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);

  // ADR-042: a GPS radius around the viewer, not a same-city text match — replaces the old
  // "type your city" gate, which silently hid alerts whenever sender and viewer typed their city
  // even slightly differently.
  function shareLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocationError("Couldn't get your location. Please allow location access and try again."),
    );
  }

  useEffect(() => {
    if (!session) return;
    if (session.user.role === "ADMIN") {
      setIsMember(true);
      setCheckingMembership(false);
      return;
    }
    fetch("/api/membership/active")
      .then((r) => r.json())
      .then((data) => setIsMember(!!data.membership))
      .finally(() => setCheckingMembership(false));
  }, [session]);

  useEffect(() => {
    // Regular members only see alerts within range of their own location (the API 400s without
    // one, admins are exempt) — so there's nothing to fetch here until location is shared.
    if (!isMember) return;
    if (session?.user.role !== "ADMIN" && !location) return;
    const query = location ? `?lat=${location.latitude}&lng=${location.longitude}` : "";
    fetch(`/api/sos/alerts${query}`)
      .then((r) => r.json())
      .then((data) => setActiveAlerts(data.alerts ?? []));
  }, [isMember, location, session?.user.role]);

  function handleAlertSent(warning: string | null) {
    setAlertSent(true);
    setProfileWarning(warning);
    setTimeout(() => setActiveTab("alerts"), 2000);
  }

  const isMyAlert = (item: SOSAlert) => item.userId === session?.user.id;

  if (checkingMembership) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">SOS Emergency</h1>
        <Skeleton className="mt-6 h-48 rounded-2xl" />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">SOS Emergency</h1>
        <MembershipUpsell />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SOS Emergency</h1>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${
            activeTab === "new" ? "bg-red-500 text-white" : "border border-foreground/10 hover:bg-foreground/5"
          }`}
        >
          🆘 New Alert
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${
            activeTab === "alerts" ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"
          }`}
        >
          Active Alerts ({activeAlerts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("help")}
          className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${
            activeTab === "help" ? "bg-accent text-white" : "border border-foreground/10 hover:bg-foreground/5"
          }`}
        >
          🗺️ Nearby Help
        </button>
      </div>

      {alertSent && (
        <div className="mt-4 rounded-2xl bg-red-500/15 px-6 py-4 text-sm text-red-400">
          <p>🆘 SOS alert sent! Nearby members and admins have been notified.</p>
          {profileWarning && (
            <p className="mt-2 rounded-lg bg-yellow-500/15 p-3 text-yellow-400">
              ⚠️ {profileWarning}
            </p>
          )}
        </div>
      )}

      {activeTab === "new" && (
        <div className="mt-4">
          <PanicAlertCards gateState="ready" onSent={handleAlertSent} />
        </div>
      )}

      {activeTab === "help" && (
        <div className="mt-4">
          <NearbyHelpPanel />
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="mt-4 space-y-3">
          {session?.user.role !== "ADMIN" && !location ? (
            <div className="rounded-2xl border border-foreground/10 bg-card p-8 text-center">
              <p className="font-semibold">Share your location to see nearby alerts</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/50">
                For everyone&apos;s privacy, SOS alerts (including reporter contact info and
                exact location) are only shown to riders near you.
              </p>
              <button
                type="button"
                onClick={shareLocation}
                className="mt-4 inline-flex rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Share my location
              </button>
              {locationError && <p className="mt-3 text-sm text-red-400">{locationError}</p>}
            </div>
          ) : activeAlerts.length === 0 ? (
            <EmptyState icon="✅" title="No active alerts" description="All clear right now." />
          ) : (
            activeAlerts.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl border bg-card p-5 ${
                  isMyAlert(a) ? "border-red-500/30 bg-red-500/5" : "border-foreground/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-sm font-semibold">
                        {alertTypes.find((t) => t.value === a.type)?.label ?? a.type}
                      </span>
                      {isMyAlert(a) && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">You</span>
                      )}
                      {a.assignedHelperId ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">Assigned</span>
                      ) : (
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/50">
                          {a.escalationTier.replace(/_/g, " ").toLowerCase()}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground/80">{a.userName}</p>
                    <div className="mt-1 space-y-0.5 text-sm text-foreground/50">
                      <p>📧 {a.userEmail}</p>
                      {a.userPhone && <p>📞 {a.userPhone}</p>}
                      {a.formattedAddress || a.placeName ? (
                        <p>📍 {a.formattedAddress ?? [a.placeName, a.area, a.city].filter(Boolean).join(", ")}</p>
                      ) : (
                        <p>🏙️ {a.city}</p>
                      )}
                      <p>
                        <a
                          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-text hover:underline"
                        >
                          View on map
                        </a>
                      </p>
                    </div>
                    {a.description && (
                      <p className="mt-2 text-sm text-foreground/70">{a.description}</p>
                    )}
                    <p className="mt-2 text-xs text-foreground/40">
                      {new Date(a.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/dashboard/sos/${a.id}`}
                      className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                    >
                      {isMyAlert(a) ? "View" : "Respond"}
                    </Link>
                    {session?.user.role === "ADMIN" && (
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/sos/alerts/${a.id}/resolve`, { method: "POST" });
                          setActiveAlerts((prev) => prev.filter((x) => x.id !== a.id));
                        }}
                        className="rounded-lg bg-success/20 px-4 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/30"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
