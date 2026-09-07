"use client";

import { useEffect, useState } from "react";
import type { NotificationDTO } from "@bikie/types";

/**
 * One shared notification poller for the whole app. Both `NotificationBell` (rendered more than
 * once in the navbar) and `NotificationsTab` subscribe to this instead of each running their own
 * `setInterval` + mount-time fetch.
 *
 * Why this exists: the bell is gated behind `!isPending && session` in the navbar, and
 * `authClient.useSession()`'s `isPending` flickers on navbar re-renders (which happen on every
 * scroll), so the bell was remounting constantly and firing a fresh `GET /api/notifications` each
 * time. A module-level cache + min-refetch gap makes a remount a no-op; a single module-level
 * interval + `visibilitychange` guard means N mounted consumers still produce one request per
 * cycle, and none while the tab is backgrounded.
 */
const POLL_INTERVAL_MS = 60_000;
/** A fetch triggered within this window of the last successful one is served from cache — this is
 * what neutralizes the remount storm. */
const MIN_REFETCH_GAP_MS = 15_000;

let cache: NotificationDTO[] | null = null;
let lastFetchAt = 0;
let inFlight: Promise<NotificationDTO[]> | null = null;
const listeners = new Set<(n: NotificationDTO[]) => void>();

function emit() {
  if (cache) for (const l of listeners) l(cache);
}

async function fetchNotifications(force = false): Promise<NotificationDTO[]> {
  if (!force && cache && Date.now() - lastFetchAt < MIN_REFETCH_GAP_MS) return cache;
  if (inFlight) return inFlight;
  inFlight = fetch("/api/notifications")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { notifications?: NotificationDTO[] } | null) => {
      if (data?.notifications) {
        cache = data.notifications;
        lastFetchAt = Date.now();
        emit();
      }
      return cache ?? [];
    })
    .catch(() => cache ?? [])
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

let started = false;
function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  const tick = () => {
    if (document.visibilityState === "visible" && listeners.size > 0) void fetchNotifications();
  };
  setInterval(tick, POLL_INTERVAL_MS);
  // Coming back to a tab that was hidden for a while should refresh once, promptly.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tick();
  });
}

/** Optimistic local edit (mark-read / mark-all-read) — updates the shared cache and notifies
 * every subscriber, so marking a notification read in the tab updates the bell badge instantly. */
function patchCache(updater: (n: NotificationDTO) => NotificationDTO) {
  if (!cache) return;
  cache = cache.map(updater);
  emit();
}

export function useNotificationPoll() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>(cache ?? []);

  useEffect(() => {
    ensureStarted();
    listeners.add(setNotifications);
    // `useState(cache ?? [])` already seeded from the shared cache on mount; this just refreshes
    // it (throttled — a remount within MIN_REFETCH_GAP_MS is a no-op) and fans the result out.
    void fetchNotifications();
    return () => {
      listeners.delete(setNotifications);
    };
  }, []);

  return {
    notifications,
    refetch: () => fetchNotifications(true),
    async markRead(id: string) {
      const now = new Date().toISOString();
      patchCache((n) => (n.id === id ? { ...n, readAt: now } : n));
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    },
    async markAllRead() {
      const now = new Date().toISOString();
      patchCache((n) => (n.readAt ? n : { ...n, readAt: now }));
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      }).catch(() => {});
    },
  };
}
