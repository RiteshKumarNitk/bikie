"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Membership {
  id: string;
  plan: { name: string; benefits: string[] };
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export default function DashboardMembershipPage() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/membership/active")
      .then((r) => r.json())
      .then((data) => setMembership(data.membership))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-card" />;

  if (!membership) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Membership</h1>
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-2xl">
            💎
          </div>
          <h2 className="mt-4 text-lg font-semibold">You&apos;re not a member yet</h2>
          <p className="mt-2 text-sm text-foreground/50 max-w-md mx-auto">
            Join BIKIE Premium for discounts on every booking, free cancellation, priority support, and exclusive trips.
          </p>
          <Link
            href="/membership"
            className="mt-6 inline-flex rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            View Membership Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Membership</h1>

      <div className="mt-6 rounded-2xl border border-accent/20 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-text">Active</span>
            <h2 className="mt-3 text-xl font-semibold">{membership.plan.name} Plan</h2>
            <p className="mt-1 text-sm text-foreground/50">
              {membership.daysLeft} days remaining · Expires{" "}
              {new Date(membership.endDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-3xl">
            💎
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium">Benefits included</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {membership.plan.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/70">
                <span className="text-accent-text">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}