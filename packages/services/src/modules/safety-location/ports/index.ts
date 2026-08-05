import type { SOSAlertCreateInput, SOSAlertDTO } from "@bikie/types";
import type { CommunicationsPorts } from "../../communications/ports";
import type { SOSRecipient } from "../domain/dispatch-message";

/** Internal create input — severity/radius/escalation timing are always server-derived
 * (escalation.application.ts), never taken from the client's SOSAlertCreateInput. */
export type SosAlertCreateData = SOSAlertCreateInput & {
  userId: string;
  severity: string;
  currentRadiusMeters: number;
  nextEscalationAt: Date | null;
};

export interface SosAlertRepositoryPort {
  createAlert(data: SosAlertCreateData): Promise<SOSAlertDTO>;
  getActiveAlerts(city?: string): Promise<SOSAlertDTO[]>;
  getAlertById(alertId: string): Promise<SOSAlertDTO | null>;
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
  autoResolveStaleAlerts(minutes: number): Promise<Array<{ id: string }>>;
  bulkResolve(alertIds: string[]): Promise<void>;
  /** Cron-poll query key for GET /api/cron/sos-escalate. */
  findAlertsDueForEscalation(before: Date, take?: number): Promise<SOSAlertDTO[]>;
  updateEscalationState(
    alertId: string,
    data: { escalationTier?: string; currentRadiusMeters?: number; nextEscalationAt: Date | null },
  ): Promise<void>;
  /** De-dup source for radius-expansion notifications. */
  findNotifiedUserIdsForAlert(alertId: string): Promise<Set<string>>;
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
  /** The transactional accept — see sos-session.repository.ts for the concurrency guard. */
  acceptOffer(params: { alertId: string; offerId: string; actorId: string }): Promise<SosSessionRow>;
  getSessionById(sessionId: string): Promise<SosSessionWithParticipants | null>;
  getActiveSessionForAlert(alertId: string): Promise<SosSessionWithParticipants | null>;
  updateSessionStatus(
    sessionId: string,
    status: "HELPER_ARRIVED" | "ASSISTANCE_IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    cancelReason?: string,
  ): Promise<SosSessionRow>;
  submitRating(sessionId: string, rating: number, comment?: string): Promise<void>;
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
}

/** Partner-shaped DTO for SOS fan-out — no Prisma types. */
export interface PartnerDispatchRow {
  userId: string;
  businessName: string;
  contactPerson1Name: string | null;
  contactPerson1Mobile: string | null;
  contactPerson2Name: string | null;
  contactPerson2Mobile: string | null;
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

export interface SafetyLocationPorts {
  sosAlerts: SosAlertRepositoryPort;
  sosOffers: SosOfferRepositoryPort;
  sosSessions: SosSessionRepositoryPort;
  sosTimeline: SosTimelineRepositoryPort;
  community: CommunityMembershipPort;
  riderLocation: RiderLocationRepositoryPort;
  partnerDispatch: PartnerDispatchPort;
  emergencyContacts: EmergencyContactsPort;
  userContact: UserContactPort;
  escalation: EscalationPort;
  places: PlacesPort;
  notifications: InAppNotificationPort;
  communications: CommunicationsPorts;
}

export type { SOSRecipient };
