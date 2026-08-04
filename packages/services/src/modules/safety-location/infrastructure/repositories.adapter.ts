import {
  communityRepository,
  partnerRepository,
  riderLocationRepository,
  riderProfileRepository,
  sosRepository,
  sosSessionRepository,
  sosTimelineRepository,
  userRepository,
} from "@bikie/database";
import type {
  CommunityMembershipPort,
  EmergencyContactsPort,
  EscalationPort,
  PartnerDispatchPort,
  RiderLocationRepositoryPort,
  SosAlertRepositoryPort,
  SosOfferRepositoryPort,
  SosSessionRepositoryPort,
  SosTimelineRepositoryPort,
  UserContactPort,
} from "../ports";
import { AlreadyAssignedError, OfferNotAvailableError } from "../ports";

export function createSosAlertRepositoryAdapter(): SosAlertRepositoryPort {
  return {
    createAlert: (data) => sosRepository.createAlert(data),
    getActiveAlerts: (city) => sosRepository.getActiveAlerts(city),
    getAlertById: (alertId) => sosRepository.getAlertById(alertId),
    resolveAlert: (alertId, userId) => sosRepository.resolveAlert(alertId, userId),
    respondToAlert: (alertId, responderId, message) =>
      sosRepository.respondToAlert(alertId, responderId, message),
    getAlertHistory: (userId) => sosRepository.getAlertHistory(userId),
    autoResolveStaleAlerts: (minutes) => sosRepository.autoResolveStaleAlerts(minutes),
    bulkResolve: (alertIds) => sosRepository.bulkResolve(alertIds),
    findAlertsDueForEscalation: (before, take) => sosRepository.findAlertsDueForEscalation(before, take) as any,
    updateEscalationState: (alertId, data) => sosRepository.updateEscalationState(alertId, data),
    findNotifiedUserIdsForAlert: (alertId) => sosRepository.findNotifiedUserIdsForAlert(alertId),
  };
}

export function createSosOfferRepositoryAdapter(): SosOfferRepositoryPort {
  return {
    createOffer: (params) => sosSessionRepository.createOffer(params) as any,
    withdrawOffer: async (offerId, responderId) => {
      try {
        await sosSessionRepository.withdrawOffer(offerId, responderId);
      } catch (err) {
        if (err instanceof sosSessionRepository.OfferNotAvailableError) throw new OfferNotAvailableError(err.message);
        throw err;
      }
    },
    rejectOffer: async (alertId, offerId, actorId) => {
      try {
        await sosSessionRepository.rejectOffer(alertId, offerId, actorId);
      } catch (err) {
        if (err instanceof sosSessionRepository.OfferNotAvailableError) throw new OfferNotAvailableError(err.message);
        throw err;
      }
    },
    listOffersForAlert: (alertId) => sosSessionRepository.listOffersForAlert(alertId) as any,
  };
}

export function createSosSessionRepositoryAdapter(): SosSessionRepositoryPort {
  return {
    acceptOffer: async (params) => {
      try {
        return (await sosSessionRepository.acceptOffer(params)) as any;
      } catch (err) {
        if (err instanceof sosSessionRepository.AlreadyAssignedError) throw new AlreadyAssignedError(err.message);
        if (err instanceof sosSessionRepository.OfferNotAvailableError) throw new OfferNotAvailableError(err.message);
        throw err;
      }
    },
    getSessionById: (sessionId) => sosSessionRepository.getSessionById(sessionId) as any,
    getActiveSessionForAlert: (alertId) => sosSessionRepository.getActiveSessionForAlert(alertId) as any,
    updateSessionStatus: (sessionId, status, cancelReason) =>
      sosSessionRepository.updateSessionStatus(sessionId, status, cancelReason) as any,
    submitRating: (sessionId, rating, comment) => sosSessionRepository.submitRating(sessionId, rating, comment).then(() => undefined),
  };
}

export function createSosTimelineRepositoryAdapter(): SosTimelineRepositoryPort {
  return {
    record: (event) => sosTimelineRepository.record(event),
    listForAlert: (alertId) =>
      sosTimelineRepository.listForAlert(alertId).then((rows) =>
        rows.map((r: any) => ({
          id: r.id,
          alertId: r.alertId,
          sessionId: r.sessionId,
          type: r.type,
          actorId: r.actorId,
          actorName: r.actor?.name ?? null,
          createdAt: r.createdAt,
        })),
      ),
  };
}

export function createCommunityMembershipAdapter(): CommunityMembershipPort {
  return {
    findSharedGroupMemberIds: (reporterId, candidateUserIds) =>
      communityRepository.findSharedGroupMemberIds(reporterId, candidateUserIds),
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
