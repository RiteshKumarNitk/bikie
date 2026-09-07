"use client";

import Link from "next/link";
import { useNotificationPoll } from "@/lib/use-notification-poll";

/** Bell icon + unread-count badge, backed by the shared `useNotificationPoll` subscriber (one
 * app-wide throttled, visibility-aware poll of `GET /api/notifications` — see that file for why
 * each consumer no longer runs its own interval). Unread count is derived client-side from
 * `readAt`; there is no dedicated count endpoint. Links to `/dashboard/notifications`. */
export function NotificationBell() {
  const { notifications } = useNotificationPoll();
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
