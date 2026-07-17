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
  createdAt: string;
}

const alertTypes = [
  { value: "ACCIDENT", label: "🚑 Accident", desc: "I've been in an accident" },
  { value: "BIKE_BREAKDOWN", label: "🔧 Bike Breakdown", desc: "My bike has broken down" },
  { value: "FUEL_EMPTY", label: "⛽ Out of Fuel", desc: "I've run out of fuel" },
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
  const [city, setCity] = useState("");
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);

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
    // Regular members only see alerts from riders in the same city (the API 400s without one,
    // admins are exempt) — so there's nothing to fetch here until a city is provided, same
    // field used by the "New Alert" form above.
    if (!isMember) return;
    if (session?.user.role !== "ADMIN" && !city.trim()) return;
    fetch(`/api/sos/alerts${city.trim() ? `?city=${encodeURIComponent(city.trim())}` : ""}`)
      .then((r) => r.json())
      .then((data) => setActiveAlerts(data.alerts ?? []));
  }, [isMember, city, session?.user.role]);

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
          {session?.user.role !== "ADMIN" && !city.trim() ? (
            <div className="rounded-2xl border border-foreground/10 bg-card p-8 text-center">
              <p className="font-semibold">Share your city to see nearby alerts</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/50">
                For everyone&apos;s privacy, SOS alerts (including reporter contact info and
                exact location) are only shown to riders in the same city.
              </p>
              <div className="mx-auto mt-4 max-w-sm">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Goa, Manali"
                  className="w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>
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
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground/80">{a.userName}</p>
                    <div className="mt-1 space-y-0.5 text-sm text-foreground/50">
                      <p>📧 {a.userEmail}</p>
                      {a.userPhone && <p>📞 {a.userPhone}</p>}
                      <p>🏙️ {a.city}</p>
                      <p>
                        📍{" "}
                        <a
                          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-text hover:underline"
                        >
                          {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)} — view on map
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
                    {!isMyAlert(a) && (
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/sos/alerts/${a.id}/respond`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: "On my way!" }),
                          });
                          window.alert("Response sent! The person has been notified.");
                        }}
                        className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                      >
                        I&apos;m Nearby
                      </button>
                    )}
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
