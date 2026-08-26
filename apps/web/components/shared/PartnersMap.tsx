"use client";

import { useEffect, useRef } from "react";
import type * as LeafletTypes from "leaflet";

/** Read-only companion to `LocationPicker.tsx` — plots partner pins instead of picking one.
 * Same Leaflet + OpenStreetMap tiles, no Google Maps API key needed (ADR-036). */

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export interface PartnersMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Optional detail fields — when provided, the marker opens a popup with them on click/tap
   * instead of a bare name-only hover tooltip. */
  typeLabel?: string;
  isAvailable?: boolean;
  distanceMeters?: number;
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function popupHtml(pin: PartnersMapPin): string {
  const parts = [`<strong>${escapeHtml(pin.name)}</strong>`];
  const meta: string[] = [];
  if (pin.typeLabel) meta.push(escapeHtml(pin.typeLabel));
  if (pin.distanceMeters != null) meta.push(formatDistance(pin.distanceMeters));
  if (meta.length > 0) parts.push(`<div>${meta.join(" · ")}</div>`);
  if (pin.isAvailable != null) {
    parts.push(
      `<div style="color:${pin.isAvailable ? "#22c55e" : "#888"}">${pin.isAvailable ? "🟢 Available" : "⚫ Offline"}</div>`,
    );
  }
  parts.push(`<div style="margin-top:4px;font-size:11px;color:#888">Business location, not live GPS</div>`);
  return parts.join("");
}

export function PartnersMap({
  pins,
  center,
  height = "16rem",
}: {
  pins: PartnersMapPin[];
  /** Defaults to the first pin, then India, if not provided. Rendered as a distinct red dot. */
  center?: { latitude: number; longitude: number };
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const layerRef = useRef<LeafletTypes.LayerGroup | null>(null);
  const leafletRef = useRef<typeof LeafletTypes | null>(null);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const centerRef = useRef(center);
  centerRef.current = center;

  const draw = () => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;

    const pins = pinsRef.current;
    const center = centerRef.current;
    layer.clearLayers();

    if (center) {
      L.circleMarker([center.latitude, center.longitude], {
        radius: 8,
        color: "#fff",
        weight: 2,
        fillColor: "#ef4444",
        fillOpacity: 1,
      })
        .bindTooltip("Your location")
        .addTo(layer);
    }

    const markerIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    for (const pin of pins) {
      L.marker([pin.latitude, pin.longitude], { icon: markerIcon }).bindPopup(popupHtml(pin)).addTo(layer);
    }

    const focus: [number, number] = center
      ? [center.latitude, center.longitude]
      : pins[0]
        ? [pins[0].latitude, pins[0].longitude]
        : INDIA_CENTER;
    map.setView(focus, pins.length > 0 ? 12 : 5);
  };

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
      leafletRef.current = L;

      const pins = pinsRef.current;
      const center = centerRef.current;
      const focus: [number, number] = center
        ? [center.latitude, center.longitude]
        : pins[0]
          ? [pins[0].latitude, pins[0].longitude]
          : INDIA_CENTER;

      const map = L.map(containerRef.current).setView(focus, pins.length > 0 ? 12 : 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      draw();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map created once; re-drawn imperatively below on pins/center change
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draw() reads the latest pins/center via refs
  }, [pins, center?.latitude, center?.longitude]);

  return <div ref={containerRef} style={{ height }} className="w-full overflow-hidden rounded-xl border border-foreground/10" />;
}
