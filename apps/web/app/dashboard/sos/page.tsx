"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
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

export default function SOSPage() {
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<"new" | "alerts">("new");
  const [alertType, setAlertType] = useState("ACCIDENT");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [alertSent, setAlertSent] = useState(false);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sos/alerts")
      .then((r) => r.json())
      .then((data) => setActiveAlerts(data.alerts));
  }, []);

  function getLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      () => {
        setLocError("Could not get location. Please enter your city manually.");
      },
    );
  }

  async function handleSendAlert() {
    if (!location && !city) {
      setLocError("Please allow location access or enter your city");
      return;
    }
    setSending(true);
    const res = await fetch("/api/sos/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: alertType,
        description,
        latitude: location?.lat ?? 0,
        longitude: location?.lng ?? 0,
        city: city || "Unknown",
      }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setSent(true);
      setAlertSent(true);
      if (data.profileWarning) setProfileWarning(data.profileWarning);
      setTimeout(() => { setActiveTab("alerts"); setSent(false); }, 2000);
    }
  }

  const isMyAlert = (item: SOSAlert) => item.userId === session?.user.id;

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
      </div>

      {alertSent && (
        <div className="mt-4 rounded-2xl bg-red-500/15 px-6 py-4 text-sm text-red-400">
          <p>🆘 SOS alert sent! Nearby users and admins have been notified.</p>
          {profileWarning && (
            <p className="mt-2 rounded-lg bg-yellow-500/15 p-3 text-yellow-400">
              ⚠️ {profileWarning}
            </p>
          )}
        </div>
      )}

      {activeTab === "new" && (
        <div className="mt-4 rounded-2xl border border-foreground/10 bg-card p-6">
          <p className="text-lg font-semibold">What&apos;s happening?</p>
          <p className="mt-1 text-sm text-foreground/50">Your location and alert will be shared with nearby users and admins.</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {alertTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => { setAlertType(type.value); setSent(false); }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  alertType === type.value
                    ? "border-red-500 bg-red-500/10 ring-1 ring-red-500"
                    : "border-foreground/10 hover:border-foreground/20"
                }`}
              >
                <p className="text-lg">{type.label.split(" ")[0]}</p>
                <p className="mt-1 text-sm font-medium">{type.label.split(" ").slice(1).join(" ")}</p>
                <p className="mt-0.5 text-xs text-foreground/50">{type.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium">Additional details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your situation..."
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Your City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Goa, Manali"
              className="mt-1.5 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={getLocation}
              className="rounded-xl border border-foreground/10 px-4 py-2 text-xs font-medium transition-colors hover:bg-foreground/5"
            >
              {location ? "📍 Location captured" : "Share my location"}
            </button>
            {location && (
              <span className="text-xs text-foreground/50">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
          </div>
          {locError && <p className="mt-2 text-xs text-red-400">{locError}</p>}

          <button
            type="button"
            onClick={handleSendAlert}
            disabled={sending || sent}
            className="mt-6 w-full rounded-xl bg-red-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {sending ? "Sending..." : sent ? "✓ Alert Sent!" : `Send SOS Alert — ${alertTypes.find((t) => t.value === alertType)?.label}`}
          </button>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="mt-4 space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm text-foreground/50">
              <p className="text-2xl">✅</p>
              <p className="mt-2 font-medium">No active alerts</p>
              <p className="mt-1">All clear in your area.</p>
            </div>
          ) : (
            activeAlerts.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl border bg-card p-5 ${
                  isMyAlert(a) ? "border-red-500/30 bg-red-500/5" : "border-foreground/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <span className="text-sm font-semibold">
                        {alertTypes.find((t) => t.value === a.type)?.label ?? a.type}
                      </span>
                      {isMyAlert(a) && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">You</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/60">
                      {a.userName} · {a.city}
                    </p>
                    {a.userPhone && (
                      <p className="mt-1 text-sm text-foreground/50">📞 {a.userPhone}</p>
                    )}
                    {a.description && (
                      <p className="mt-2 text-sm text-foreground/70">{a.description}</p>
                    )}
                    <p className="mt-2 text-xs text-foreground/40">
                      {new Date(a.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex gap-2">
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