import type { SOSAlertDTO } from "@bikie/types";

/**
 * The alert shape every repository method and internal consumer (dispatch, sessions, timeline
 * text, the partner dashboard) works with — straight from the database, never redacted.
 * `SOSAlertDTO`'s `userEmail`/`latitude`/`longitude` are nullable because that's the *public*,
 * possibly-redacted shape a viewer receives over HTTP (ADR-045); the repository/port layer never
 * redacts, so those three fields are always genuinely present here. Only
 * `sos.application.ts`'s `getActiveAlerts`/`getAlertById` — the two functions that sit right at
 * the HTTP boundary — narrow a `RawSOSAlertDTO` down to the possibly-null public `SOSAlertDTO`.
 */
export type RawSOSAlertDTO = Omit<SOSAlertDTO, "userEmail" | "latitude" | "longitude"> & {
  userEmail: string;
  latitude: number;
  longitude: number;
};

/**
 * Whether a viewer may see an alert's contact info and exact location (ADR-045). Mirrors the
 * exact ownership check `resolveAlert`/`updateSessionStatus` already use in
 * `session.application.ts`/`sos.application.ts` — the reporter, the currently assigned helper,
 * or an admin. Everyone else (including a helper who's only offered, not yet accepted) is a
 * pre-assignment viewer and gets the redacted shape.
 */
export function isPrivilegedViewer(
  alert: Pick<SOSAlertDTO, "userId" | "assignedHelperId">,
  viewer: { userId: string; isAdmin: boolean },
): boolean {
  if (viewer.isAdmin) return true;
  if (alert.userId === viewer.userId) return true;
  if (alert.assignedHelperId && alert.assignedHelperId === viewer.userId) return true;
  return false;
}

/**
 * Nulls out contact info and exact/reverse-geocoded location for a non-privileged viewer.
 * `userName`, `city`, `type`, `severity`, `escalationTier`, `description`, and the rest stay —
 * enough to decide whether an alert is worth responding to, without exposing how to find or
 * contact the reporter before someone is actually assigned. `distanceMeters` (set separately by
 * the repository from the viewer's own supplied coordinates) is never touched here — a distance
 * scalar isn't PII, and losing it would make a redacted list unusable.
 */
export function redactAlertForViewer(alert: SOSAlertDTO, privileged: boolean): SOSAlertDTO {
  if (privileged) return alert;
  return {
    ...alert,
    userPhone: null,
    userEmail: null,
    latitude: null,
    longitude: null,
    placeName: null,
    area: null,
    formattedAddress: null,
  };
}
