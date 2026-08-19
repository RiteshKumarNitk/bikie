"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActiveMembership {
  planId: string;
  plan: { name: string; price: number };
  daysLeft: number;
  endDate: string;
}

type MembershipQuery = { loading: boolean; active: boolean; membership: ActiveMembership | null };

/**
 * ADR-056 — `GET /api/partner-membership/active` requires only a session (no `accountType` or
 * capability check), so it's always safe to call from any `/partner/**` page regardless of
 * whether the caller actually has an active membership yet — that's the whole point of this
 * hook existing. Every client-side membership-gated UI on the dashboard reads from here rather
 * than re-fetching itself, so "does this account have an active ₹99/month membership" has
 * exactly one answer, sourced from the server, never guessed at or cached in local state.
 */
export function usePartnerMembershipStatus(): MembershipQuery {
  const [state, setState] = useState<MembershipQuery>({ loading: true, active: false, membership: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/partner-membership/active")
      .then((res) => (res.ok ? res.json() : { membership: null }))
      .then((data: { membership: ActiveMembership | null }) => {
        if (cancelled) return;
        setState({ loading: false, active: data.membership != null, membership: data.membership ?? null });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, active: false, membership: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * Small inline notice for a feature area gated behind `requirePartnerCapability` (fleet,
 * bookings, SOS, reviews, analytics, payouts) — self-fetches membership status and renders
 * nothing while loading or once a membership is active, so it's safe to always mount at the top
 * of any of those pages without extra plumbing. `feature` names what's locked in the copy.
 */
export function MembershipRequiredNotice({ feature }: { feature: string }) {
  const { loading, active } = usePartnerMembershipStatus();
  if (loading || active) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
      <div>
        <p className="text-sm font-semibold text-amber-400">🔒 {feature} requires an active membership</p>
        <p className="mt-0.5 text-xs text-foreground/60">
          Activate your ₹99/month Service Provider membership to unlock {feature.toLowerCase()}.
        </p>
      </div>
      <Link
        href="/partner/membership"
        className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
      >
        Subscribe — ₹99/month
      </Link>
    </div>
  );
}

const LOCKED_FEATURES = [
  "Receive & accept SOS assistance requests",
  "Go available to riders nearby",
  "List and manage your fleet",
  "Accept bookings from riders",
];

/**
 * The rich, non-blocking dashboard-level card for `/partner` itself — renders nothing while
 * loading or once a membership is active. Never a gate: the profile, stats (all honestly zero
 * for a brand-new account), and every nav item stay reachable underneath it, per ADR-056's
 * "explore the dashboard, understand what you're missing" requirement.
 */
export function PartnerActivationCard() {
  const { loading, active } = usePartnerMembershipStatus();
  if (loading || active) return null;

  return (
    <div className="mt-4 rounded-3xl border border-accent/20 bg-accent/5 p-6">
      <p className="text-base font-semibold">Your Service Provider profile is ready.</p>
      <p className="mt-1.5 text-sm text-foreground/70">
        Activate your ₹99/month membership to start receiving and responding to assistance
        requests.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
            Locked until you subscribe
          </p>
          <ul className="mt-2 space-y-1.5">
            {LOCKED_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground/60">
                <span className="mt-0.5">🔒</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
            Available right now
          </p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-start gap-2 text-sm text-foreground/60">
              <span className="mt-0.5 text-accent-text">✓</span>
              Your business profile, saved and visible to admins
            </li>
            <li className="flex items-start gap-2 text-sm text-foreground/60">
              <span className="mt-0.5 text-accent-text">✓</span>
              Optional verification, whenever you&apos;re ready
            </li>
            <li className="flex items-start gap-2 text-sm text-foreground/60">
              <span className="mt-0.5 text-accent-text">✓</span>
              Full dashboard preview — see what membership unlocks
            </li>
          </ul>
        </div>
      </div>

      <Link
        href="/partner/membership"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Subscribe — ₹99/month
      </Link>
    </div>
  );
}
