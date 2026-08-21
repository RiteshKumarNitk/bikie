"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PreviewItem {
  key: string;
  alertId: string;
  type: string;
  subtitle: string;
  badge?: string;
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

/** The Overview page's own glance at SOS Emergency — previously nothing on this page hinted a
 * nearby/pending/active assistance request existed at all; a Service Provider had to already know
 * to click "SOS Emergency" in the sidebar. Mirrors mobile's `PartnerHomeScreen`, which has always
 * shown this preview on its own Home tab. Read-only: every action (Accept/Decline/Open) still
 * happens on the full `/partner/sos` page or an alert's own detail page. */
export function PartnerSosPreview() {
  const [items, setItems] = useState<PreviewItem[] | null>(null);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const location = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
        );
      });

      const [pendingRes, activeRes, nearbyRes] = await Promise.all([
        fetch("/api/partner/sos/pending"),
        fetch("/api/partner/sos/active"),
        location
          ? fetch(`/api/partner/sos/nearby?lat=${location.latitude}&lng=${location.longitude}`)
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      const pending = pendingRes.ok ? ((await pendingRes.json()).offers ?? []) : [];
      const active = activeRes.ok ? ((await activeRes.json()).sessions ?? []) : [];
      const nearby = nearbyRes?.ok ? ((await nearbyRes.json()).requests ?? []) : [];

      setActiveCount(active.length);

      const preview: PreviewItem[] = [
        ...active.slice(0, 3).map((s: { id: string; alertId: string; alertType: string; riderName: string }) => ({
          key: `active-${s.id}`,
          alertId: s.alertId,
          type: s.alertType,
          subtitle: `Confirmed · ${s.riderName}`,
        })),
        ...pending
          .slice(0, 3)
          .map((o: { offerId: string; alertId: string; alertType: string }) => ({
            key: `pending-${o.offerId}`,
            alertId: o.alertId,
            type: o.alertType,
            subtitle: "Waiting for rider to confirm",
          })),
        ...nearby
          .slice(0, 3)
          .map((r: { id: string; type: string; distanceMeters: number; severity: string }) => ({
            key: `nearby-${r.id}`,
            alertId: r.id,
            type: r.type,
            subtitle: formatDistance(r.distanceMeters),
            badge: r.severity === "EMERGENCY" ? "🔴 HIGH PRIORITY" : undefined,
          })),
      ].slice(0, 3);

      setItems(preview);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-8 rounded-2xl border border-foreground/10 bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            SOS Emergency{activeCount > 0 && <span className="text-red-400"> · {activeCount} active</span>}
          </h2>
          <p className="mt-1 text-sm text-foreground/60">Nearby and in-progress assistance requests.</p>
        </div>
        <Link href="/partner/sos" className="shrink-0 text-sm text-accent-text hover:underline">
          See all
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {items === null ? (
          <p className="text-sm text-foreground/40">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-foreground/40">Nothing to show right now.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.key}
              href={`/partner/sos/${item.alertId}`}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-foreground/5"
            >
              <div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-sm font-medium">{TYPE_LABEL[item.type] ?? item.type}</span>
                </div>
                <p className="text-xs text-foreground/50">{item.subtitle}</p>
              </div>
              <span className="text-xs text-accent-text">View →</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
