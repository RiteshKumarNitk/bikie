"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MyAlert {
  id: string;
  type: string;
  severity: string;
  assignedHelperId: string | null;
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

/** A rider's own open SOS alert, surfaced directly on the dashboard Home page — previously the
 * only way back to an alert you'd just sent was the one-time "View Alert" link on the send
 * confirmation, or digging through the SOS Emergency page's full nearby-community list (which
 * also requires sharing location, unlike this banner — `GET /api/sos/alerts/mine` needs none). */
export function MyActiveSosAlertBanner() {
  const [alert, setAlert] = useState<MyAlert | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/sos/alerts/mine").then(async (r) => {
      if (!r.ok) return setAlert(null);
      const data = await r.json();
      setAlert(data.alerts?.[0] ?? null);
    });
  }, []);

  if (!alert) return null;

  const isEmergency = alert.severity === "EMERGENCY";

  return (
    <Link
      href={`/dashboard/sos/${alert.id}`}
      className={`flex items-center justify-between gap-4 rounded-2xl border p-5 transition-colors hover:bg-foreground/5 ${
        isEmergency ? "border-red-500/30 bg-red-500/10" : "border-orange-500/30 bg-orange-500/10"
      }`}
    >
      <div>
        <p className={`text-sm font-semibold ${isEmergency ? "text-red-400" : "text-orange-400"}`}>
          Your SOS alert is active
        </p>
        <p className="mt-0.5 text-sm text-foreground/60">
          {TYPE_LABEL[alert.type] ?? alert.type} ·{" "}
          {alert.assignedHelperId != null ? "Helper assigned" : "Searching for help nearby"}
        </p>
      </div>
      <span className="shrink-0 text-sm text-accent-text">View →</span>
    </Link>
  );
}
