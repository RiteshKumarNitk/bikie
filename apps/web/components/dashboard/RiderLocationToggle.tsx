"use client";

import { useEffect, useRef, useState } from "react";

const PUSH_INTERVAL_MS = 45_000;

export function RiderLocationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [membershipRequired, setMembershipRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/rider-location/consent")
      .then(async (res) => {
        if (res.status === 403) {
          setMembershipRequired(true);
          return;
        }
        const data = await res.json();
        setEnabled(!!data.enabled);
      })
      .finally(() => setLoaded(true));
  }, []);

  function pushFix() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch("/api/rider-location", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => {},
    );
  }

  useEffect(() => {
    if (!enabled) return;
    pushFix();
    intervalRef.current = setInterval(pushFix, PUSH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  async function handleToggle() {
    const next = !enabled;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rider-location/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEnabled(next);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (membershipRequired) {
    return (
      <p className="text-sm text-foreground/60">
        Nearby Riders is a BIKIE Membership perk.{" "}
        <a href="/membership" className="font-medium text-accent-text hover:underline">
          View plans
        </a>
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Share my live location</p>
        <p className="mt-0.5 text-sm text-foreground/60">
          Lets other BIKIE members find nearby riders. Turns off automatically after 30 minutes
          of inactivity — you can also turn it off here anytime.
        </p>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || !loaded}
        className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
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
