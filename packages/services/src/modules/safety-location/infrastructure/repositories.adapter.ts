import {
  partnerRepository,
  riderLocationRepository,
  riderProfileRepository,
  sosRepository,
  userRepository,
} from "@bikie/database";
import type {
  EmergencyContactsPort,
  EscalationPort,
  PartnerDispatchPort,
  RiderLocationRepositoryPort,
  SosAlertRepositoryPort,
  UserContactPort,
} from "../ports";

export function createSosAlertRepositoryAdapter(): SosAlertRepositoryPort {
  return {
    createAlert: (data) => sosRepository.createAlert(data),
    getActiveAlerts: (city) => sosRepository.getActiveAlerts(city),
    resolveAlert: (alertId, userId) => sosRepository.resolveAlert(alertId, userId),
    respondToAlert: (alertId, responderId, message) =>
      sosRepository.respondToAlert(alertId, responderId, message),
    getAlertHistory: (userId) => sosRepository.getAlertHistory(userId),
    autoResolveStaleAlerts: (minutes) => sosRepository.autoResolveStaleAlerts(minutes),
  };
}

export function createRiderLocationRepositoryAdapter(): RiderLocationRepositoryPort {
  return {
    setSharingEnabled: (userId, enabled) => riderLocationRepository.setSharingEnabled(userId, enabled),
    getSharingEnabled: (userId) => riderLocationRepository.getSharingEnabled(userId),
    updateLocationIfSharing: (userId, lat, lng) =>
      riderLocationRepository.updateLocationIfSharing(userId, lat, lng),
    findNearby: (userId, radiusMeters) => riderLocationRepository.findNearby(userId, radiusMeters),
    findNearbyAroundPoint: (lat, lng, excludeUserId, radiusMeters) =>
      riderLocationRepository.findNearbyAroundPoint(lat, lng, excludeUserId, radiusMeters),
    autoDisableStaleSharing: (minutes) => riderLocationRepository.autoDisableStaleSharing(minutes),
  };
}

export function createPartnerDispatchAdapter(): PartnerDispatchPort {
  return {
    async findByCity(city, take = 25) {
      const partners = await partnerRepository.findPartnersByCityForDispatch(city, take);
      return partners.map((p: {
        userId: string;
        businessName: string;
        contactPerson1Name: string | null;
        contactPerson1Mobile: string | null;
        contactPerson2Name: string | null;
        contactPerson2Mobile: string | null;
        user: { id: string; name: string; email: string; phone: string | null };
      }) => ({
        userId: p.userId,
        businessName: p.businessName,
        contactPerson1Name: p.contactPerson1Name,
        contactPerson1Mobile: p.contactPerson1Mobile,
        contactPerson2Name: p.contactPerson2Name,
        contactPerson2Mobile: p.contactPerson2Mobile,
        user: {
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          phone: p.user.phone,
        },
      }));
    },
  };
}

export function createEmergencyContactsAdapter(): EmergencyContactsPort {
  return {
    async findByUserId(userId) {
      const profile = await riderProfileRepository.findByUserId(userId);
      if (!profile?.emergencyContacts?.length) return [];
      return profile.emergencyContacts.map(
        (c: { name: string; phone: string; email: string | null; relation: string | null }) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          relation: c.relation,
        }),
      );
    },
  };
}

export function createUserContactAdapter(): UserContactPort {
  return {
    findSosContactFields: (userId) => userRepository.findSosContactFields(userId),
  };
}

export function createEscalationAdapter(): EscalationPort {
  return {
    findAdminContacts: (take) => userRepository.findAdminContacts(take),
  };
}
