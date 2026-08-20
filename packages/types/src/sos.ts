export interface SOSAlertDTO {
  id: string;
  userId: string;
  userName: string;
  /** Null for a viewer who is neither the reporter, the assigned helper, nor an admin (ADR-045
   * PII redaction) — every other reader already tolerated null here since it was already
   * nullable at the source (a rider without a saved phone number). */
  userPhone: string | null;
  /** Same redaction as `userPhone`, ADR-045 — was previously always non-null (every user has an
   * email), so this is the one field that newly became nullable for non-privileged viewers. */
  userEmail: string | null;
  type: string;
  description: string | null;
  /** Null for a non-privileged pre-assignment viewer (ADR-045) — exact coordinates are withheld
   * until the reporter/admin/assigned helper is looking. `city` (always present) and, for list
   * results, `distanceMeters` remain available so browsing still makes sense without them. */
  latitude: number | null;
  longitude: number | null;
  city: string;
  status: string;
  severity: string;
  escalationTier: string;
  currentRadiusMeters: number;
  assignedHelperId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  /** Reverse-geocoded from latitude/longitude at creation time (ADR-038) — null if the lookup
   * failed or timed out, OR redacted for a non-privileged pre-assignment viewer (ADR-045). Every
   * reader already falls back to `city`/raw coordinates when null. */
  placeName: string | null;
  area: string | null;
  formattedAddress: string | null;
  /** From the reporting rider's own RiderProfile (ADR-044) — most riders never fill this in, so
   * null is the common case. Lets a responding partner see what they're riding before arriving. */
  riderVehicleType: string | null;
  riderVehicleBrand: string | null;
  riderVehicleModel: string | null;
  /** ADR-059 — feeds the DLT "BIKIE_SR" dispatch SMS template's Vehicle Registration Number slot. */
  riderVehicleRegistrationNumber: string | null;
  /** ADR-045 — server-computed straight-line distance from the viewer's own supplied lat/lng,
   * only present on `GET /api/sos/alerts?lat=&lng=` results (undefined everywhere else, e.g. the
   * single-alert detail route, which has no viewer location to compute against). Compensates for
   * `latitude`/`longitude` being redacted pre-assignment — distance alone isn't PII. */
  distanceMeters?: number | null;
}

export interface SOSAlertCreateInput {
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface SOSOfferDTO {
  id: string;
  alertId: string;
  responderId: string;
  responderName: string;
  responderPhone: string | null;
  status: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
  message: string | null;
  createdAt: string;
}

export interface SOSSessionDTO {
  id: string;
  alertId: string;
  helperId: string;
  riderId: string;
  status: string;
  conversationId: string | null;
  startedAt: string;
  helperArrivedAt: string | null;
  assistanceStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  rating: number | null;
  ratingComment: string | null;
}

export interface SOSTimelineEventDTO {
  id: string;
  alertId: string;
  sessionId: string | null;
  type: string;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
}