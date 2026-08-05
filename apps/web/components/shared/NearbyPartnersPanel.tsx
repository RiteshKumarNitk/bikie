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
  distanceMeters: number;
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
          const res = await fetch(`/api/partners/nearby?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error("Failed");
          const data: { partners: NearbyPartner[] } = await res.json();
          setPartners(data.partners ?? []);
          setPins(
            (data.partners ?? []).map((p) => ({ id: p.id, name: p.businessName, latitude: p.latitude, longitude: p.longitude })),
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
        See BIKIE's own verified mechanics, fuel delivery, and rental partners on a map.
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
            <p className="text-sm text-foreground/50">No registered service providers found nearby yet.</p>
          ) : (
            <>
              <PartnersMap pins={pins} center={center ?? undefined} height="18rem" />
              <div className="space-y-2">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.businessName}</p>
                      <p className="truncate text-xs text-foreground/50">
                        {TYPE_LABEL[p.type] ?? p.type} · {p.city}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground/50">
                      {p.distanceMeters < 1000 ? `${Math.round(p.distanceMeters)} m` : `${(p.distanceMeters / 1000).toFixed(1)} km`}
                    </span>
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
