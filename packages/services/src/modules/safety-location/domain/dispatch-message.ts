import type { SOSAlertDTO } from "@bikie/types";
import { alertKind } from "./alert-kind";
import { formatDistance, mapsNavigateUrl, mapsPinUrl } from "./maps";

export type SOSRecipientRole =
  | "NEARBY_RIDER"
  | "SERVICE_PROVIDER"
  | "EMERGENCY_CONTACT"
  | "EMERGENCY_SERVICES"
  /** Escalation-only fallback used when an alert would otherwise reach nobody (ADR-030). */
  | "PLATFORM_ADMIN";

export interface SOSRecipient {
  role: SOSRecipientRole;
  name: string;
  phone?: string | null;
  email?: string | null;
  /** In-app notification target (platform users only). */
  userId?: string;
  distanceMeters?: number;
}

/** Human-readable location for notification text (ADR-038) — prefers the reverse-geocoded
 * address, falls back to a placeName/area/city join, falls back to bare city. Never GPS-only;
 * the raw coordinates stay available as a secondary line/map link for anyone who wants them. */
/** "BIKE_BREAKDOWN" -> "Bike Breakdown" — used in partner push copy (ADR-044). */
export function humanizeSosType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function describeLocation(alert: SOSAlertDTO): string {
  if (alert.formattedAddress) return alert.formattedAddress;
  const parts = [alert.placeName, alert.area, alert.city].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(", ") : alert.city;
}

export function buildTextBody(alert: SOSAlertDTO, recipient: SOSRecipient): string {
  const kind = alertKind(alert.description);
  const label =
    kind === "RED" ? "RED ALERT (Emergency)" : kind === "AMBER" ? "AMBER ALERT (Assistance)" : "SOS ALERT";
  const roleHint =
    recipient.role === "EMERGENCY_CONTACT"
      ? "You are listed as an emergency contact."
      : recipient.role === "SERVICE_PROVIDER"
        ? "A rider near your service area needs help."
        : recipient.role === "EMERGENCY_SERVICES"
          ? "Automated BIKIE emergency dispatch."
          : recipient.role === "PLATFORM_ADMIN"
            ? "Escalation: this alert reached no nearby riders, providers, or emergency contacts."
            : "A fellow BIKIE rider nearby needs help.";

  const pin = mapsPinUrl(alert.latitude, alert.longitude);
  const navigate = mapsNavigateUrl(alert.latitude, alert.longitude);
  const distance = formatDistance(recipient.distanceMeters);

  return [
    `BIKIE ${label}`,
    roleHint,
    distance ? `Your distance (approx): ${distance}` : null,
    `Rider: ${alert.userName}${alert.userPhone ? ` (${alert.userPhone})` : ""}`,
    `Type: ${alert.type}${alert.description ? ` — ${alert.description}` : ""}`,
    `Location: ${describeLocation(alert)}`,
    `GPS: ${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`,
    `📍 Location pin: ${pin}`,
    `🧭 Open in Maps (shows YOUR distance & route): ${navigate}`,
    `Respond in the BIKIE app → Dashboard → SOS`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildEmailHtml(alert: SOSAlertDTO, recipient: SOSRecipient): string {
  const pin = mapsPinUrl(alert.latitude, alert.longitude);
  const navigate = mapsNavigateUrl(alert.latitude, alert.longitude);
  const distance = formatDistance(recipient.distanceMeters);
  const kind = alertKind(alert.description);
  const title =
    kind === "RED" ? "Red Alert — Emergency" : kind === "AMBER" ? "Amber Alert — Assistance" : "SOS Alert";

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin:0 0 8px">${title}</h2>
      <p style="margin:0 0 12px;color:#444">${
        recipient.role === "NEARBY_RIDER"
          ? "A fellow BIKIE rider nearby needs help."
          : recipient.role === "SERVICE_PROVIDER"
            ? "A rider near your service area needs help."
            : recipient.role === "EMERGENCY_CONTACT"
              ? "You are listed as an emergency contact for this rider."
              : recipient.role === "PLATFORM_ADMIN"
                ? "Escalation: this alert reached no nearby riders, providers, or emergency contacts."
                : "BIKIE emergency dispatch."
      }</p>
      ${distance ? `<p style="margin:0 0 12px"><strong>Approx. distance from you:</strong> ${distance}</p>` : ""}
      <p style="margin:0 0 4px"><strong>Rider:</strong> ${alert.userName}${alert.userPhone ? ` (${alert.userPhone})` : ""}</p>
      <p style="margin:0 0 4px"><strong>Type:</strong> ${alert.type}${alert.description ? ` — ${alert.description}` : ""}</p>
      <p style="margin:0 0 16px"><strong>Location:</strong> ${describeLocation(alert)}<br/>
         <strong>GPS:</strong> ${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}</p>
      <p style="margin:0 0 12px">
        <a href="${navigate}" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600">
          Open in Google Maps — see distance & route
        </a>
      </p>
      <p style="margin:0 0 16px;font-size:13px">
        <a href="${pin}">View location pin</a>
      </p>
      <p style="margin:0;font-size:13px;color:#666">Respond in the BIKIE app → Dashboard → SOS</p>
    </div>
  `;
}
