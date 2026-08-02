import type { SOSAlertCreateInput, SOSAlertDTO } from "@bikie/types";
import type { CommunicationsPorts } from "../../communications/ports";
import type { SOSRecipient } from "../domain/dispatch-message";

export interface SosAlertRepositoryPort {
  createAlert(data: SOSAlertCreateInput & { userId: string }): Promise<SOSAlertDTO>;
  getActiveAlerts(city?: string): Promise<SOSAlertDTO[]>;
  resolveAlert(alertId: string, userId: string): Promise<void>;
  respondToAlert(alertId: string, responderId: string, message?: string): Promise<void>;
  getAlertHistory(userId: string): Promise<
    Array<{
      id: string;
      type: string;
      description: string | null;
      city: string;
      status: string;
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
  autoResolveStaleAlerts(minutes: number): Promise<void>;
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
  findByCity(city: string, take?: number): Promise<PartnerDispatchRow[]>;
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
