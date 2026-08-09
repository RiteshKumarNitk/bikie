"use client";

import { useEffect, useState } from "react";
import { NotificationDTO } from "@bikie/types";
import { authClient } from "@/lib/auth-client";

const POLL_INTERVAL_MS = 45_000;

/** Pull the first https Maps / URL out of a notification body for a CTA button. */
function extractMapsUrl(body: string): string | null {
  const match = body.match(/https:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com)[^\s]+/i);
  return match?.[0] ?? null;
}

function linkifyBody(body: string) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    part.startsWith("http") ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-accent-text underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {part.includes("maps") ? "Open in Google Maps" : part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function NotificationsTab({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  // An approved Service Provider has their own SOS dashboard (/partner/sos) — route the "Open
  // SOS dashboard" link there instead of the generic Rider one (ADR-046b: keyed on capability,
  // not `role`, since a dual-capability account's role no longer indicates this).
  const { data: session } = authClient.useSession();
  const sosDashboardHref = session?.user.partnerStatus === "APPROVED" ? "/partner/sos" : "/dashboard/sos";

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setNotifications(data.notifications || []);
        });
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_ALL_READ" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="flex-1 overflow-y-auto space-y-2 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-foreground/70 tracking-wide uppercase">
          Notifications {unreadCount > 0 && <span className="bg-accent text-white px-2 py-0.5 rounded-full text-[10px] ml-1">{unreadCount}</span>}
        </h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-accent-text hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        notifications.map((n) => {
          const mapsUrl = n.type === "SOS_ALERT" ? extractMapsUrl(n.body) : null;
          return (
            <div
              key={n.id}
              onClick={() => !n.readAt && markRead(n.id)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                n.readAt ? "border-foreground/10 bg-card opacity-70" : "border-accent bg-accent/5"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-[10px] text-foreground/50 whitespace-nowrap mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{linkifyBody(n.body)}</p>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ff4d1a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e64516]"
                  onClick={(e) => e.stopPropagation()}
                >
                  🧭 Open in Maps — see distance & route
                </a>
              )}

              {n.entity === "Trip" && n.entityId && (
                <a
                  href={`/trips/${n.entityId}`}
                  className="mt-3 block w-fit text-xs font-medium text-accent-text hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Trip ↗
                </a>
              )}

              {n.type === "SOS_ALERT" && n.entityId && (
                <a
                  href={sosDashboardHref}
                  className="mt-2 ml-0 block w-fit text-xs font-medium text-accent-text hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open SOS dashboard ↗
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
