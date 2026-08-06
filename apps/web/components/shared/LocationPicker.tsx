"use client";

import { useEffect, useRef } from "react";
import type * as LeafletTypes from "leaflet";

/**
 * Draggable-marker map for picking a shop location (ADR-036) — the first embedded map anywhere
 * in this app; everywhere else (SOS, NearbyHelpPanel) only produces external
 * `https://www.google.com/maps/...` links. Uses Leaflet + raw OpenStreetMap tiles rather than
 * Google Maps JS SDK — no API key, no billing account needed.
 *
 * OSM's tile usage policy (operations.osmfoundation.org/policies/tiles/) is meant for light/
 * moderate use, not sustained high-traffic production load — fine to start with zero setup cost;
 * revisit with a dedicated free-tier tile provider (MapTiler, Stadia Maps, etc.) if usage grows.
 */

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export interface LocationPickerValue {
  latitude: number;
  longitude: number;
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: LocationPickerValue | null;
  onChange: (value: LocationPickerValue) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const markerRef = useRef<LeafletTypes.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Leaflet touches `window`/`document` at module-import time (browser feature detection), so it
  // must only ever load in the browser. A static top-level `import` would execute during Next's
  // SSR pass — "use client" still gets server-rendered for the initial HTML — and crash the
  // build (ReferenceError: window is not defined), even on routes that never render this
  // component, if Turbopack groups it into a shared chunk. A dynamic `import()` inside this
  // effect defers loading entirely to the client, sidestepping the issue outright.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Leaflet's default marker icon references relative image paths that break once bundled
      // by Next.js/webpack — point at the same CDN Leaflet's own docs recommend as the workaround.
      const markerIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const center: [number, number] = value ? [value.latitude, value.longitude] : INDIA_CENTER;
      const map = L.map(containerRef.current).setView(center, value ? 15 : 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(center, { icon: markerIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ latitude: pos.lat, longitude: pos.lng });
      });
      map.on("click", (e: LeafletTypes.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only initialize once; drag/click drive updates from here on
  }, []);

  // Keep the marker in sync if `value` changes from outside (e.g. resetting the form).
  useEffect(() => {
    if (!markerRef.current || !value) return;
    const latlng: [number, number] = [value.latitude, value.longitude];
    markerRef.current.setLatLng(latlng);
    mapRef.current?.panTo(latlng);
  }, [value?.latitude, value?.longitude]);

  return (
    <div>
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-xl border border-foreground/10" />
      <p className="mt-1.5 text-xs text-foreground/50">
        {value
          ? `Pin set at ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)} — click or drag to adjust.`
          : "Click anywhere on the map to drop a pin at your shop's location."}
      </p>
    </div>
  );
}
