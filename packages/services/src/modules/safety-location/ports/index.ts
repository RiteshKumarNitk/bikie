import type { SOSAlertCreateInput, SOSAlertDTO } from "@bikie/types";
import type { CommunicationsPorts } from "../../communications/ports";
import type { SOSRecipient } from "../domain/dispatch-message";
import type { RawSOSAlertDTO } from "../domain/pii-redaction";

export type { RawSOSAlertDTO };

/** Internal create input — severity/radius/escalation timing are always server-derived
 * (escalation.application.ts), never taken from the client's SOSAlertCreateInput. */
export type SosAlertCreateData = SOSAlertCreateInput & {
  userId: string;
  severity: string;
  currentRadiusMeters: number;
  nextEscalationAt: Date | null;
  placeName?: string | null;
  area?: string | null;
  formattedAddress?: string | null;
};

/** GPS radius around the viewer's own location — replaces the old free-text `city` match
 * (ADR-042: exact case-sensitive string matching silently hid otherwise-nearby alerts whenever
 * sender and viewer typed their city differently). `undefined` (ADMIN only, enforced by the
 * route) returns every active alert network-wide, unfiltered. */
export type SosLocationFilter = { latitude: number; longitude: number; radiusMeters: number };

export interface SosAlertRepositoryPort {
  createAlert(data: SosAlertCreateData): Promise<RawSOSAlertDTO>;
  getActiveAlerts(location?: SosLocationFilter): Promise<RawSOSAlertDTO[]>;
  getAlertById(alertId: string): Promise<RawSOSAlertDTO | null>;
  resolveAlert(alertId: string, userId: string): Promise<void>;
  /** Deprecated alias target for the old /respond route — new callers use SosOfferRepositoryPort. */
  respondToAlert(alertId: string, responderId: string, message?: string): Promise<void>;
  getAlertHistory(userId: string): Promise<
    Array<{
      id: string;
      type: string;
      description: string | null;
      city: string;
      status: string;
      severity: string;
      escalationTier: string;
      assignedHelperId: string | null;
      resolvedAt: string | null;
      createdAt: string;
      responses: Array<{
        id: string;
        responderName: string;
        message: string | null;
        createdAt: string;
      }>;
    }>
  >;
  /** Returns the alerts that are now stale, so the caller (application layer) can cascade
   * timeline/session cleanup before writing RESOLVED — not a raw bulk update itself. */
  autoResolveStaleAlerts(
    minutes: number,
  ): Promise<Array<{ id: string; userId: string; assignedHelperId: string | null }>>;
  bulkResolve(alertIds: string[]): Promise<void>;
  /** Cron-poll query key for GET /api/cron/sos-escalate. */
  findAlertsDueForEscalation(before: Date, take?: number): Promise<RawSOSAlertDTO[]>;
  updateEscalationState(
    alertId: string,
    data: { escalationTier?: string; currentRadiusMeters?: number; nextEscalationAt: Date | null },
  ): Promise<void>;
  /** De-dup source for radius-expansion notifications. */
  findNotifiedUserIdsForAlert(alertId: string): Promise<Set<string>>;
  /** ADR-044 — open (unassigned, ACTIVE) alerts within a radius, for a partner's own "Nearby
   * Requests" list. Distinct from `getActiveAlerts(location)`: that one intentionally still
   * shows already-assigned alerts to riders/admins browsing; a partner shouldn't see a request
   * someone else already claimed. */
  getOpenAlertsNearPoint(latitude: number, longitude: number, radiusMeters: number): Promise<RawSOSAlertDTO[]>;
  /** §28 — the reporter (or admin) cancels an alert while it's being dispatched: marks it
   * FALSE_ALARM and stops escalation. Returns 0 if the alert was no longer ACTIVE (the caller
   * maps that to ALERT_NOT_ACTIVE). Offer expiry + responder notifications are the caller's job. */
  cancelAlert(alertId: string, userId: string): Promise<number>;
}

export interface SosOfferRow {
  id: string;
  alertId: string;
  responderId: string;
  responder: { id: string; name: string; phone: string | null; email: string };
  status: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
  message: string | null;
  createdAt: Date;
}

export interface SosOfferRepositoryPort {
  createOffer(params: {
    alertId: string;
    responderId: string;
    distanceMeters?: number;
    etaMinutes?: number;
    message?: string;
  }): Promise<SosOfferRow>;
  withdrawOffer(offerId: string, responderId: string): Promise<void>;
  rejectOffer(alertId: string, offerId: string, actorId: string): Promise<void>;
  listOffersForAlert(alertId: string): Promise<SosOfferRow[]>;
  /** ADR-045 — a responder declines without ever offering; throws AlreadyOfferedError on a
   * repeat response (offer or decline) for the same [alertId, responderId]. */
  declineAlert(params: { alertId: string; responderId: string; message?: string }): Promise<SosOfferRow>;
  /** ADR-045 — which of these alert IDs this responder has already offered on or declined, so a
   * partner's "Nearby Requests" list can exclude them. */
  findRespondedAlertIds(responderId: string, alertIds: string[]): Promise<Set<string>>;
  /** §28 — expire every outstanding OFFERED offer on the alert and return the responders who had
   * one, so the caller can tell them the request is no longer available. */
  expireOpenOffersForAlert(alertId: string): Promise<string[]>;
}

export interface SosSessionRow {
  id: string;
  alertId: string;
  helperId: string;
  riderId: string;
  status: string;
  conversationId: string | null;
  startedAt: Date;
  helperArrivedAt: Date | null;
  assistanceStartedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  rating: number | null;
  ratingComment: string | null;
}

export class AlreadyAssignedError extends Error {}
export class OfferNotAvailableError extends Error {}
export class AlreadyOfferedError extends Error {}

export type SosSessionWithParticipants = SosSessionRow & {
  helper: { id: string; name: string; phone: string | null; email: string };
  rider: { id: string; name: string; phone: string | null; email: string };
};

export interface SosSessionRepositoryPort {
  /** The transactional accept — see sos-session.repository.ts for the concurrency guard.
   * `expiredResponderIds` (ADR-047) is every other responder whose pending OFFERED offer was
   * auto-invalidated by this acceptance, so the caller can tell them the request is no longer
   * available. */
  acceptOffer(params: {
    alertId: string;
    offerId: string;
    actorId: string;
  }): Promise<{ session: SosSessionRow; expiredResponderIds: string[] }>;
  getSessionById(sessionId: string): Promise<SosSessionWithParticipants | null>;
  getActiveSessionForAlert(alertId: string): Promise<SosSessionWithParticipants | null>;
  updateSessionStatus(
    sessionId: string,
    status: "HELPER_ARRIVED" | "ASSISTANCE_IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    cancelReason?: string,
  ): Promise<SosSessionRow>;
  submitRating(sessionId: string, rating: number, comment?: string): Promise<void>;
  /** ADR-044 — the concurrency cap: which of these candidate helpers already has an open
   * (ACTIVE/HELPER_ARRIVED/ASSISTANCE_IN_PROGRESS) session, and so shouldn't be dispatched or
   * allowed to offer on another alert right now. */
  findActiveHelperUserIds(userIds: string[]): Promise<Set<string>>;
  countSessionsForHelperSince(helperId: string, since: Date): Promise<number>;
  countActiveSessionsForHelper(helperId: string): Promise<number>;
  listActiveSessionsForHelper(helperId: string): Promise<PartnerActiveSessionRow[]>;
  /** ADR-046b — "Completed Assistance"/"Assistance History". */
  listHistorySessionsForHelper(helperId: string): Promise<PartnerHistorySessionRow[]>;
}

/** Row shape for a partner's "Active Assistance" list (ADR-044) — `distanceMeters`/`etaMinutes`
 * come from the accepted offer that produced this session, not the session itself. */
export interface PartnerActiveSessionRow {
  sessionId: string;
  alertId: string;
  status: string;
  riderName: string;
  alertType: string;
  distanceMeters: number | null;
  etaMinutes: number | null;
}

/** Row shape for a partner's "Assistance History" list (ADR-046b) — finished sessions
 * (COMPLETED/CANCELLED), newest first. */
export interface PartnerHistorySessionRow {
  sessionId: string;
  alertId: string;
  status: string;
  riderName: string;
  alertType: string;
  completedAt: Date | null;
  cancelledAt: Date | null;
  rating: number | null;
}

export interface SosTimelineRepositoryPort {
  record(event: {
    alertId: string;
    sessionId?: string;
    type: string;
    actorId?: string;
    metadata?: unknown;
  }): Promise<void>;
  listForAlert(alertId: string): Promise<
    Array<{ id: string; alertId: string; sessionId: string | null; type: string; actorId: string | null; actorName: string | null; createdAt: Date }>
  >;
}

/** Community/club prioritization (ADR-033 Phase D hook — port fully implemented in Phase A). */
export interface CommunityMembershipPort {
  findSharedGroupMemberIds(reporterId: string, candidateUserIds: string[]): Promise<Set<string>>;
}

export interface NearbyRiderRow {
  id: string;
  name: string;
  distanceMeters: number;
}

export interface NearbyRiderContactRow {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  distanceMeters: number;
}

export interface RiderLocationRepositoryPort {
  setSharingEnabled(userId: string, enabled: boolean): Promise<void>;
  getSharingEnabled(userId: string): Promise<boolean>;
  updateLocationIfSharing(userId: string, lat: number, lng: number): Promise<number>;
  findNearby(userId: string, radiusMeters: number): Promise<NearbyRiderRow[]>;
  findNearbyAroundPoint(
    lat: number,
    lng: number,
    excludeUserId: string,
    radiusMeters: number,
  ): Promise<NearbyRiderContactRow[]>;
  autoDisableStaleSharing(minutes: number): Promise<number>;
  /** ADR-045 — independent of sharingEnabled: whether this rider should be paged as an SOS
   * dispatch candidate. */
  setReceiveSosAlerts(userId: string, enabled: boolean): Promise<void>;
  getReceiveSosAlerts(userId: string): Promise<boolean>;
}

/** Partner-shaped DTO for SOS fan-out — no Prisma types. */
export interface PartnerDispatchRow {
  userId: string;
  businessName: string;
  type: string;
  contactPerson1Name: string | null;
  contactPerson1Mobile: string | null;
  contactPerson2Name: string | null;
  contactPerson2Mobile: string | null;
  latitude: number | null;
  longitude: number | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface PartnerDispatchPort {
  findByCity(
    city: string,
    take?: number,
    options?: { type?: string; verifiedOnly?: boolean },
  ): Promise<PartnerDispatchRow[]>;
  /** ADR-044 — real eligibility for SOS dispatch: verified + available + geotagged partners
   * within a radius. Type/general-responder matching happens one layer up
   * (`partnerMatchesAlertType`, applied by the caller) — this stays a plain geo+status query. */
  findEligibleForAlert(params: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  }): Promise<Array<PartnerDispatchRow & { isGeneralResponder: boolean; distanceMeters: number }>>;
  getEligibilityFields(
    userId: string,
  ): Promise<{
    /** null when this user has no Partner profile at all (pure rider). */
    providerId: string | null;
    /** FINAL PRODUCT MODEL — the gate is "profile exists and isn't SUSPENDED", not verification.
     * Unverified providers can operate and accept assistance requests; `verificationStatus`
     * (not the derived `isVerified` boolean) is what the offer gate and nearby-requests filter
     * read, so DRAFT/PENDING/REJECTED providers stay eligible. */
    verificationStatus: string;
    isAvailable: boolean;
    isGeneralResponder: boolean;
    type: string;
  } | null>;
}

/** §25 — Rider → Service Provider service reviews. Written once per SOS session, when the rider
 * rates a COMPLETED session whose helper has a Partner profile. */
export interface ProviderReviewPort {
  addProviderReview(params: {
    providerId: string;
    riderId: string;
    sessionId: string;
    rating: number;
    comment?: string;
  }): Promise<boolean>;
}

export interface EmergencyContactRow {
  name: string;
  phone: string;
  email: string | null;
  relation: string | null;
}

export interface EmergencyContactsPort {
  findByUserId(userId: string): Promise<EmergencyContactRow[]>;
}

export interface UserContactPort {
  findSosContactFields(userId: string): Promise<{ phone: string | null; name: string } | null>;
}

export interface EscalationContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

/** Last-resort recipients when an alert resolves to nobody — an SOS must never go nowhere. */
export interface EscalationPort {
  findAdminContacts(take?: number): Promise<EscalationContactRow[]>;
}

export interface InAppNotificationPort {
  notify(
    userId: string,
    type: "SOS_ALERT",
    title: string,
    body: string,
    entity?: string,
    entityId?: string,
  ): Promise<void>;
}

export type PlaceType = "gas_station" | "car_repair" | "hospital";

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}

export interface PlacesPort {
  findNearby(lat: number, lng: number, type: PlaceType, radiusMeters?: number): Promise<NearbyPlace[]>;
}

export interface ReverseGeocodedAddress {
  placeName: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  formattedAddress: string;
}

/** Turns a GPS fix into a human-readable address (ADR-038) — used once, at SOS alert creation,
 * so every notification channel and screen can show "City Park, Malviya Nagar, Jaipur" instead
 * of raw coordinates. Returning `null` (lookup failed/timed out) is a normal, expected outcome,
 * not an error — every caller already has a city/coordinates fallback. */
export interface ReverseGeocodingPort {
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodedAddress | null>;
}

export interface SafetyLocationPorts {
  sosAlerts: SosAlertRepositoryPort;
  sosOffers: SosOfferRepositoryPort;
  sosSessions: SosSessionRepositoryPort;
  sosTimeline: SosTimelineRepositoryPort;
  providerReviews: ProviderReviewPort;
  community: CommunityMembershipPort;
  riderLocation: RiderLocationRepositoryPort;
  partnerDispatch: PartnerDispatchPort;
  emergencyContacts: EmergencyContactsPort;
  userContact: UserContactPort;
  escalation: EscalationPort;
  places: PlacesPort;
  geocoding: ReverseGeocodingPort;
  notifications: InAppNotificationPort;
  communications: CommunicationsPorts;
}

export type { SOSRecipient };
