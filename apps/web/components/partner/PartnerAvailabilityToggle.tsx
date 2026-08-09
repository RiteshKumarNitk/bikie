"use client";

import { useEffect, useState } from "react";

/** ADR-045 — the web equivalent of mobile's PartnerAvailabilityBanner: 🟢 Available / ⚫ Offline,
 * mirrors `RiderLocationToggle.tsx`'s fetch/PUT/button pattern. */
export function PartnerAvailabilityToggle() {
  const [available, setAvailable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/partner/profile")
      .then((res) => res.json())
      .then((data) => setAvailable(!!data.profile?.isAvailable))
      .finally(() => setLoaded(true));
  }, []);

  async function handleToggle() {
    const next = !available;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setAvailable(next);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${
        available ? "border-success/30 bg-success/5" : "border-foreground/10 bg-card"
      }`}
    >
      <div>
        <p className={`text-sm font-semibold ${available ? "text-success" : "text-foreground/60"}`}>
          {available ? "🟢 AVAILABLE" : "⚫ OFFLINE"}
        </p>
        <p className="mt-0.5 text-sm text-foreground/60">
          {available
            ? "Receiving nearby assistance requests."
            : "You won't receive SOS requests."}
        </p>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy || !loaded}
        className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          available
            ? "border border-foreground/15 hover:bg-foreground/5"
            : "bg-accent text-white hover:bg-accent-hover"
        }`}
      >
        {busy ? "Working…" : available ? "Go Offline" : "Go Available"}
      </button>
    </div>
  );
}
