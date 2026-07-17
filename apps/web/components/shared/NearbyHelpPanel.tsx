"use client";

import { useState } from "react";

type PlaceType = "gas_station" | "car_repair" | "hospital";

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}

const TYPES: { value: PlaceType; label: string; icon: string }[] = [
  { value: "gas_station", label: "Petrol Pump", icon: "⛽" },
  { value: "car_repair", label: "Mechanic", icon: "🔧" },
  { value: "hospital", label: "Hospital", icon: "🏥" },
];

export function NearbyHelpPanel() {
  const [type, setType] = useState<PlaceType>("gas_station");
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function findNearby(selectedType: PlaceType) {
    setType(selectedType);
    setLoading(true);
    setError(null);
    setPlaces(null);

    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/places/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&type=${selectedType}`,
          );
          if (!res.ok) throw new Error("Failed");
          const data = await res.json();
          setPlaces(data.places ?? []);
        } catch {
          setError("Couldn't load nearby places. Please try again.");
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
      <p className="text-lg font-semibold">Find nearby help</p>
      <p className="mt-1 text-sm text-foreground/50">
        Locate the closest petrol pump, mechanic, or hospital based on your current location.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => findNearby(t.value)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              type === t.value && places
                ? "border-accent bg-accent/10 text-accent-text"
                : "border-foreground/10 hover:border-foreground/20"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-4 text-sm text-foreground/50">📍 Finding nearby {type.replace("_", " ")}…</p>}
      {error && <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {places && !loading && (
        <div className="mt-4 space-y-2">
          {places.length === 0 ? (
            <p className="text-sm text-foreground/50">No results found nearby.</p>
          ) : (
            places.map((place) => (
              <div
                key={place.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-foreground/10 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{place.name}</p>
                  <p className="truncate text-xs text-foreground/50">{place.address}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-foreground/50">
                    {place.distanceMeters < 1000
                      ? `${place.distanceMeters} m`
                      : `${(place.distanceMeters / 1000).toFixed(1)} km`}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    Directions
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
