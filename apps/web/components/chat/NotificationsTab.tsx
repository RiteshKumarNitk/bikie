"use client";

import { useEffect, useState } from "react";
import { NotificationDTO } from "@bikie/types";

export function NotificationsTab({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []));
  }, []);

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
          <button onClick={markAllRead} className="text-xs text-accent hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        notifications.map((n) => (
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
            <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{n.body}</p>
            
            {n.entity === "Trip" && n.entityId && (
              <a 
                href={`/trips/${n.entityId}`} 
                className="mt-3 block w-fit text-xs font-medium text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View Trip ↗
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}
