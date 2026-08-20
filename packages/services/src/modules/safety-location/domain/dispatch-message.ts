import type { SOSAlertDTO } from "@bikie/types";
import { alertKind } from "./alert-kind";
import { formatDistance, mapsNavigateUrl, mapsPinUrl } from "./maps";

/** Accepts both the raw (privileged) alert and the redacted pre-assignment view — the only
 * difference message-building cares about is whether latitude/longitude/userPhone are present,
 * both already nullable on `SOSAlertDTO`. See `pii-redaction.ts`/`redactAlertForViewer`, applied
 * by the caller (fan-out.application.ts) before these builders ever see a NEARBY_RIDER/
 * SERVICE_PROVIDER recipient's alert — trusted recipients (emergency contacts, admins) pass the
 * unredacted alert straight through. */
type DispatchableAlert = SOSAlertDTO;

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
  /** ADR-059 — undefined/true means eligible; explicit `false` means the SMS channel is skipped
   * for this recipient (in-app/WhatsApp/email are unaffected). Set by `markSmsEligibility` on the
   * combined nearby-rider + service-provider candidate pool before dispatch, capping the DLT
   * "BIKIE_SR" SMS to the nearest `SOS_SMS_RECIPIENT_LIMIT` — never set for the small, fixed
   * emergency-contact/admin/emergency-services recipient lists, which the cap doesn't apply to. */
  smsEligible?: boolean;
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

export function describeLocation(alert: DispatchableAlert): string {
  if (alert.formattedAddress) return alert.formattedAddress;
  const parts = [alert.placeName, alert.area, alert.city].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(", ") : alert.city;
}

export function buildTextBody(alert: DispatchableAlert, recipient: SOSRecipient): string {
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

  const distance = formatDistance(recipient.distanceMeters);
  // `latitude`/`longitude` are null on the redacted pre-assignment view (fan-out.application.ts
  // withholds exact GPS from NEARBY_RIDER/SERVICE_PROVIDER recipients until one of them is
  // actually assigned) — the map links simply don't exist on that view, not just hidden.
  const hasExactLocation = alert.latitude != null && alert.longitude != null;

  return [
    `BIKIE ${label}`,
    roleHint,
    distance ? `Your distance (approx): ${distance}` : null,
    `Rider: ${alert.userName}${alert.userPhone ? ` (${alert.userPhone})` : ""}`,
    `Type: ${alert.type}${alert.description ? ` — ${alert.description}` : ""}`,
    `Location: ${describeLocation(alert)}`,
    hasExactLocation ? `GPS: ${alert.latitude!.toFixed(5)}, ${alert.longitude!.toFixed(5)}` : null,
    hasExactLocation ? `📍 Location pin: ${mapsPinUrl(alert.latitude!, alert.longitude!)}` : null,
    hasExactLocation
      ? `🧭 Open in Maps (shows YOUR distance & route): ${mapsNavigateUrl(alert.latitude!, alert.longitude!)}`
      : null,
    `Respond in the BIKIE app → Dashboard → SOS${hasExactLocation ? "" : " (exact location shown once you're assigned)"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * ADR-059 — the DLT-approved "BIKIE_SR" template's exact fixed text (Sender ID `KSHIDL`,
 * `MSG91_SOS_HELP_TEMPLATE_ID`), for the **SMS channel only**, sent only to `NEARBY_RIDER`/
 * `SERVICE_PROVIDER` candidate-responder recipients — matches this template's own "Hello
 * Riders/Service Providers" framing exactly. WhatsApp/email/in-app keep the richer
 * `buildTextBody`/`buildEmailHtml` (no DLT constraint applies to those channels). India's TRAI
 * DLT content firewall requires an exact match to the registered text; only the three
 * `##alphanumeric##` values (rider name, vehicle reg, location) actually vary. Vehicle
 * registration is optional on `RiderProfile` and usually unset — "N/A" is a deliberate, honest
 * fallback (never an empty string, which the DLT filter may reject as not matching
 * `##alphanumeric##` at all), same posture ADR-044 already established for the sibling
 * vehicleType/Brand/Model fields being empty for most riders.
 */
export function buildSmsTemplateBody(alert: DispatchableAlert): string {
  const vehicleReg = alert.riderVehicleRegistrationNumber?.trim() || "N/A";
  return (
    `Hello Riders/Service Providers, Rider ${alert.userName}, with Vehicle registration number is ` +
    `${vehicleReg} having some emergency situation at ${describeLocation(alert)} ;Please reach out ` +
    `to Rider to Provide Moral support and Adequate help, as noted by Kiesh India`
  );
}

export function buildEmailHtml(alert: DispatchableAlert, recipient: SOSRecipient): string {
  const distance = formatDistance(recipient.distanceMeters);
  const kind = alertKind(alert.description);
  const title =
    kind === "RED" ? "Red Alert — Emergency" : kind === "AMBER" ? "Amber Alert — Assistance" : "SOS Alert";
  const hasExactLocation = alert.latitude != null && alert.longitude != null;
  const pin = hasExactLocation ? mapsPinUrl(alert.latitude!, alert.longitude!) : null;
  const navigate = hasExactLocation ? mapsNavigateUrl(alert.latitude!, alert.longitude!) : null;

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
      <p style="margin:0 0 16px"><strong>Location:</strong> ${describeLocation(alert)}${
        hasExactLocation ? `<br/><strong>GPS:</strong> ${alert.latitude!.toFixed(5)}, ${alert.longitude!.toFixed(5)}` : ""
      }</p>
      ${
        navigate
          ? `<p style="margin:0 0 12px">
        <a href="${navigate}" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600">
          Open in Google Maps — see distance & route
        </a>
      </p>`
          : ""
      }
      ${pin ? `<p style="margin:0 0 16px;font-size:13px"><a href="${pin}">View location pin</a></p>` : ""}
      <p style="margin:0;font-size:13px;color:#666">Respond in the BIKIE app → Dashboard → SOS${
        hasExactLocation ? "" : " (exact location shown once you're assigned)"
      }</p>
    </div>
  `;
}
