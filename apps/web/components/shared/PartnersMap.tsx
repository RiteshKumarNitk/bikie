"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

/** Read-only companion to `LocationPicker.tsx` — plots partner pins instead of picking one.
 * Same Leaflet + OpenStreetMap tiles, no Google Maps API key needed (ADR-036). */

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface PartnersMapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
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
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
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

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map created once; the effect below repopulates markers
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

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

    for (const pin of pins) {
      L.marker([pin.latitude, pin.longitude], { icon: markerIcon }).bindTooltip(pin.name).addTo(layer);
    }

    const focus: [number, number] = center
      ? [center.latitude, center.longitude]
      : pins[0]
        ? [pins[0].latitude, pins[0].longitude]
        : INDIA_CENTER;
    map.setView(focus, pins.length > 0 ? 12 : 5);
  }, [pins, center?.latitude, center?.longitude]);

  return <div ref={containerRef} style={{ height }} className="w-full overflow-hidden rounded-xl border border-foreground/10" />;
}
