"use client";

import { useEffect, useState } from "react";

type Settings = { pushEnabled: boolean; smsEnabled: boolean; updatedAt: string; updatedByAdminId: string | null };

/** Admin-only global on/off per channel for SOS dispatch — push (FCM) and SMS (MSG91) only.
 * WhatsApp/email aren't admin-controllable, and this never affects any other notification type
 * (bookings, moderation, …) — see channel-selection.ts / ADR for the backend side. */
export function SosNotificationSettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busyChannel, setBusyChannel] = useState<"push" | "sms" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sos/notification-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings))
      .catch(() => setError("Could not load settings."));
  }, []);

  async function toggle(channel: "push" | "sms") {
    if (!settings) return;
    const field = channel === "push" ? "pushEnabled" : "smsEnabled";
    const next = !settings[field];
    setBusyChannel(channel);
    setError(null);
    try {
      const res = await fetch("/api/admin/sos/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setSettings(data.settings);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyChannel(null);
    }
  }

  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <h2 className="text-sm font-semibold">SOS notification channels</h2>
      <p className="mt-1 text-sm text-foreground/60">
        Global switch for how SOS alerts reach responders (emergency contacts, nearby riders,
        service providers, admin fallback). Turning a channel off here stops it only for SOS —
        push/SMS for bookings and everything else is unaffected. WhatsApp and email aren&apos;t
        affected by these switches.
      </p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {!settings ? (
        <p className="mt-3 text-sm text-foreground/50">Loading…</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <ChannelRow
            label="Push notifications (FCM)"
            enabled={settings.pushEnabled}
            busy={busyChannel === "push"}
            disabled={busyChannel !== null}
            onToggle={() => toggle("push")}
          />
          <ChannelRow
            label="SMS (MSG91)"
            enabled={settings.smsEnabled}
            busy={busyChannel === "sms"}
            disabled={busyChannel !== null}
            onToggle={() => toggle("sms")}
          />
          <p className="mt-1 text-xs text-foreground/40">
            Last changed {new Date(settings.updatedAt).toLocaleString()}
            {settings.updatedByAdminId ? ` by admin ${settings.updatedByAdminId}` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}

function ChannelRow({
  label,
  enabled,
  busy,
  disabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-red-500"}`}
          aria-hidden
        />
        <span className="text-sm">{label}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          enabled
            ? "border border-foreground/15 hover:bg-foreground/5"
            : "bg-accent text-white hover:bg-accent-hover"
        }`}
      >
        {busy ? "Working…" : enabled ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}
