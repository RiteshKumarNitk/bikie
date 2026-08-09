"use client";

import { useEffect, useState } from "react";

/** ADR-045 — independent of `RiderLocationToggle` (live location sharing): whether this rider
 * should be paged as an SOS dispatch candidate at all. Mirrors that component's fetch/PUT/button
 * pattern, minus the geolocation-push effect (not relevant to this toggle). */
export function ReceiveSosAlertsToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [membershipRequired, setMembershipRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rider-location/sos-opt-out")
      .then(async (res) => {
        if (res.status === 403) {
          setMembershipRequired(true);
          return;
        }
        const data = await res.json();
        setEnabled(data.enabled !== false);
      })
      .finally(() => setLoaded(true));
  }, []);

  async function handleToggle() {
    const next = !enabled;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rider-location/sos-opt-out", {
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
        SOS is a BIKIE Membership perk.{" "}
        <a href="/membership" className="font-medium text-accent-text hover:underline">
          View plans
        </a>
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Receive SOS assistance requests</p>
        <p className="mt-0.5 text-sm text-foreground/60">
          Temporarily stop being paged for nearby riders&apos; SOS alerts without turning off
          location sharing — you stay findable, you just won&apos;t be asked to help.
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
