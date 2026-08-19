"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePartnerMembershipStatus } from "./PartnerMembershipStatus";

/** ADR-045 — the web equivalent of mobile's PartnerAvailabilityBanner: 🟢 Available / ⚫ Offline,
 * mirrors `RiderLocationToggle.tsx`'s fetch/PUT/button pattern.
 *
 * ADR-056 — `PATCH /api/partner/availability` was already server-side membership-gated
 * (`requirePartnerCapability`), so a non-member could never actually go available — but clicking
 * the button just failed with a generic "Something went wrong," giving no indication *why*.
 * `usePartnerMembershipStatus` lets this component pre-emptively disable itself and explain the
 * real reason, while the server-side gate remains the actual enforcement (this is UX, not
 * authorization — a stale/expired membership still gets caught server-side either way). */
export function PartnerAvailabilityToggle() {
  const [available, setAvailable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loading: membershipLoading, active: membershipActive } = usePartnerMembershipStatus();

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
      if (!res.ok) {
        if (res.status === 403) throw new Error("Activate your ₹99/month membership to go available.");
        throw new Error("Failed to update");
      }
      setAvailable(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!membershipLoading && !membershipActive) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-card px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground/50">🔒 UNAVAILABLE</p>
          <p className="mt-0.5 text-sm text-foreground/60">
            Activate your ₹99/month membership to go available and receive SOS requests.
          </p>
        </div>
        <Link
          href="/partner/membership"
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Subscribe
        </Link>
      </div>
    );
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
