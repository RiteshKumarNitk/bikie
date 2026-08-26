"use client";

import { useState } from "react";
import { PartnersMap, type PartnersMapPin } from "@/components/shared/PartnersMap";

interface NearbyPartner {
  id: string;
  businessName: string;
  type: string;
  city: string;
  latitude: number;
  longitude: number;
  verificationStatus: string;
  isAvailable: boolean;
  ratingAvg: number;
  ratingCount: number;
  distanceMeters: number;
}

function isVerified(p: NearbyPartner): boolean {
  return p.verificationStatus === "APPROVED";
}

const TYPE_LABEL: Record<string, string> = {
  RENTAL: "Bike Rental",
  MECHANIC: "Mechanic",
  FUEL_DELIVERY: "Fuel Delivery",
  TOUR_GUIDE: "Tour Guide",
  HOTEL: "Hotel",
  CAMPING: "Camping",
  ACCESSORIES: "Accessories",
  PHOTOGRAPHY: "Photography",
};

/** "Service providers near you" section on /roadside-assistance (ADR-036) — the first place a
 * rider (logged in or not) can see BIKIE's own registered partners on a map, distinct from
 * NearbyHelpPanel.tsx's generic Google Places search for petrol/mechanic/hospital. */
export function NearbyPartnersPanel() {
  const [partners, setPartners] = useState<NearbyPartner[] | null>(null);
  const [pins, setPins] = useState<PartnersMapPin[]>([]);
  const [center, setCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function findNearby() {
    setLoading(true);
    setError(null);
    setPartners(null);

    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ latitude, longitude });
        try {
          // eligibleOnly: same availability + active-membership rule SOS dispatch already uses —
          // a rider looking for help on a map shouldn't be shown an offline or lapsed provider as
          // a live option.
          const res = await fetch(`/api/partners/nearby?lat=${latitude}&lng=${longitude}&eligibleOnly=true`);
          if (!res.ok) throw new Error("Failed");
          const data: { partners: NearbyPartner[] } = await res.json();
          setPartners(data.partners ?? []);
          setPins(
            (data.partners ?? []).map((p) => ({
              id: p.id,
              name: p.businessName,
              latitude: p.latitude,
              longitude: p.longitude,
              typeLabel: TYPE_LABEL[p.type] ?? p.type,
              isAvailable: p.isAvailable,
              distanceMeters: p.distanceMeters,
            })),
          );
        } catch {
          setError("Couldn't load nearby service providers. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Couldn't get your location. Please enable location access and try again.");
        setLoading(false);
      },
    );
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-6">
      <p className="text-lg font-semibold">Service providers near you</p>
      <p className="mt-1 text-sm text-foreground/50">
        See BIKIE's currently available mechanics, fuel delivery, and rental partners on a map —
        each with its verification status, so you know exactly who's been checked by BIKIE.
        Markers show each provider's registered business location, not a live GPS position.
      </p>

      <button
        type="button"
        onClick={findNearby}
        disabled={loading}
        className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Finding nearby partners…" : "📍 Find service providers near me"}
      </button>

      {error && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {partners && !loading && (
        <div className="mt-4 space-y-3">
          {partners.length === 0 ? (
            <p className="text-sm text-foreground/50">No available service providers found nearby right now.</p>
          ) : (
            <>
              <PartnersMap pins={pins} center={center ?? undefined} height="18rem" />
              <p className="text-xs text-foreground/40">
                📍 Pins mark each provider's business location, not their live position. Tap a pin for details.
              </p>
              <div className="space-y-2">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{p.businessName}</p>
                        {isVerified(p) ? (
                          <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            ✓ BIKIE Verified
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
                            ⚠ Unverified
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-foreground/50">
                        {TYPE_LABEL[p.type] ?? p.type} · {p.city}
                        {p.ratingCount > 0 && ` · ⭐ ${p.ratingAvg.toFixed(1)} (${p.ratingCount})`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-foreground/50">
                        {p.distanceMeters < 1000 ? `${Math.round(p.distanceMeters)} m` : `${(p.distanceMeters / 1000).toFixed(1)} km`}
                      </span>
                      <span className={`text-[11px] ${p.isAvailable ? "text-success" : "text-foreground/40"}`}>
                        {p.isAvailable ? "🟢 Available" : "⚫ Offline"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
