"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@bikie/ui";
import { EmptyState } from "@/components/shared/EmptyState";

interface NearbyRider {
  id: string;
  name: string;
  distanceMeters: number;
}

function MembershipUpsell() {
  return (
    <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-2xl">
        🏍️
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nearby Riders is a Membership perk</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50">
        Finding fellow riders nearby is available to active BIKIE members only.
      </p>
      <Link
        href="/membership"
        className="mt-6 inline-flex rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        View Membership Plans
      </Link>
    </div>
  );
}

export default function NearbyRidersPage() {
  const { data: session } = authClient.useSession();
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [riders, setRiders] = useState<NearbyRider[]>([]);
  const [sharingDisabled, setSharingDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    if (session.user.role === "ADMIN") {
      setIsMember(true);
      setCheckingMembership(false);
      return;
    }
    fetch("/api/membership/active")
      .then((r) => r.json())
      .then((data) => setIsMember(!!data.membership))
      .finally(() => setCheckingMembership(false));
  }, [session]);

  useEffect(() => {
    if (!isMember) return;
    setLoading(true);
    setError(null);
    setSharingDisabled(false);
    fetch(`/api/riders/nearby?radiusKm=${radiusKm}`)
      .then(async (res) => {
        if (res.status === 409) {
          setSharingDisabled(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setRiders(data.riders ?? []);
      })
      .catch(() => setError("Couldn't load nearby riders. Please try again."))
      .finally(() => setLoading(false));
  }, [isMember, radiusKm]);

  if (checkingMembership) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Nearby Riders</h1>
        <Skeleton className="mt-6 h-48 rounded-2xl" />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Nearby Riders</h1>
        <MembershipUpsell />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nearby Riders</h1>
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none"
        >
          {[1, 2, 5, 10, 25].map((km) => (
            <option key={km} value={km} className="bg-card">
              Within {km} km
            </option>
          ))}
        </select>
      </div>

      {sharingDisabled ? (
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-card p-8 text-center">
          <p className="font-semibold">Turn on location sharing to see nearby riders</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/50">
            You need to share your own live location to find other riders nearby — it's a two-way
            street.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Go to Settings
          </Link>
        </div>
      ) : error ? (
        <div className="mt-4 rounded-2xl bg-red-500/15 px-6 py-4 text-sm text-red-400">{error}</div>
      ) : loading ? (
        <Skeleton className="mt-6 h-48 rounded-2xl" />
      ) : riders.length === 0 ? (
        <EmptyState
          icon="🏍️"
          title="No riders nearby"
          description={`No sharing riders found within ${radiusKm} km right now.`}
        />
      ) : (
        <div className="mt-4 space-y-3">
          {riders.map((rider) => (
            <div key={rider.id} className="flex items-center justify-between rounded-2xl border border-foreground/10 bg-card p-5">
              <p className="text-sm font-medium">{rider.name}</p>
              <span className="text-xs text-foreground/50">
                {rider.distanceMeters < 1000
                  ? `${rider.distanceMeters} m away`
                  : `${(rider.distanceMeters / 1000).toFixed(1)} km away`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
