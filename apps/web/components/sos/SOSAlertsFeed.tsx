"use client";

import { useState, useEffect } from "react";

type Alert = {
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
};

const alertLabels: Record<string, string> = {
  ACCIDENT: "🚑 Accident",
  BIKE_BREAKDOWN: "🔧 Bike Breakdown",
  FUEL_EMPTY: "⛽ Out of Fuel",
  MEDICAL: "🏥 Medical Emergency",
  LOST: "🗺️ Lost",
  OTHER: "❗ Other",
};

export function SOSAlertsFeed({ alerts: initial, live }: { alerts: Alert[]; live?: boolean }) {
  const [alerts, setAlerts] = useState(initial);

  useEffect(() => {
    if (!live) return;

    const es = new EventSource("/api/sse");
    es.addEventListener("sos_alert", (e) => {
      try {
        const alert = JSON.parse(e.data);
        setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
      } catch {}
    });
    return () => es.close();
  }, [live]);

  async function resolve(id: string) {
    await fetch(`/api/sos/alerts/${id}/resolve`, { method: "POST" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (alerts.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-white/5 p-8 text-center text-sm text-white/50">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-medium">No active alerts</p>
        <p className="mt-1">All clear.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-semibold">{alertLabels[alert.type] ?? alert.type}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-white/80">{alert.userName}</p>
              <div className="mt-1 space-y-0.5 text-sm text-white/60">
                <p>📧 {alert.userEmail}</p>
                {alert.userPhone && <p>📞 {alert.userPhone}</p>}
                <p>🏙️ {alert.city}</p>
                <p>
                  📍{" "}
                  <a
                    href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-text hover:underline"
                  >
                    {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)} — view on map
                  </a>
                </p>
              </div>
              {alert.description && <p className="mt-2 text-sm text-white/70">{alert.description}</p>}
              <p className="mt-2 text-xs text-white/40">{new Date(alert.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={() => resolve(alert.id)}
              className="rounded-lg bg-green-600/20 px-4 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-600/30"
            >
              Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}