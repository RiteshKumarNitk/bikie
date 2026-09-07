"use client";

import { authClient } from "@/lib/auth-client";
import { useNotificationPoll } from "@/lib/use-notification-poll";

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

export function NotificationsTab() {
  // Shared app-wide poller (throttled, visibility-aware, deduped across the navbar bell + this
  // tab) — see `use-notification-poll.ts`. `markRead`/`markAllRead` update that shared cache, so
  // the bell's unread badge reacts immediately.
  const { notifications, markRead, markAllRead } = useNotificationPoll();
  // A capable Service Provider (ADR-049: active profile, verification status irrelevant here)
  // has their own SOS dashboard (/partner/sos) — route the "Open SOS dashboard" link there
  // instead of the generic Rider one (keyed on capability, not `role` or verification).
  const { data: session } = authClient.useSession();
  const sosDashboardHref =
    session?.user.partnerStatus != null && session.user.partnerStatus !== "SUSPENDED"
      ? "/partner/sos"
      : "/dashboard/sos";

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
