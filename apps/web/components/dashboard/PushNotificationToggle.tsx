"use client";

import { useEffect, useState } from "react";
import { enablePushNotifications } from "@/lib/push-notifications";

const STORAGE_KEY = "bikie-push-token";

export function PushNotificationToggle() {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(STORAGE_KEY));
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const newToken = await enablePushNotifications();
      if (!newToken) {
        setError("Push notifications aren't available in this browser, or permission was denied.");
        return;
      }
      const res = await fetch("/api/notifications/push-token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: newToken }),
      });
      if (!res.ok) throw new Error("Failed to register");
      localStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
    } catch {
      setError("Something went wrong enabling push notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/notifications/push-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
    } catch {
      setError("Something went wrong turning off push notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Push notifications</p>
        <p className="mt-0.5 text-sm text-foreground/60">
          Get notified in this browser for bookings, trip requests, chat, and SOS alerts.
        </p>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
      <button
        type="button"
        onClick={token ? handleDisable : handleEnable}
        disabled={busy}
        className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          token
            ? "border border-foreground/15 hover:bg-foreground/5"
            : "bg-accent text-white hover:bg-accent-hover"
        }`}
      >
        {busy ? "Working…" : token ? "Turn off" : "Enable"}
      </button>
    </div>
  );
}
