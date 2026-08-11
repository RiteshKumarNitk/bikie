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
  ProviderReviewPort,
  RiderLocationRepositoryPort,
  SosAlertRepositoryPort,
  SosOfferRepositoryPort,
  SosSessionRepositoryPort,
  SosTimelineRepositoryPort,
  UserContactPort,
} from "../ports";
import { AlreadyAssignedError, AlreadyOfferedError, OfferNotAvailableError } from "../ports";

export function createSosAlertRepositoryAdapter(): SosAlertRepositoryPort {
  return {
    createAlert: (data) => sosRepository.createAlert(data),
    getActiveAlerts: (location) => sosRepository.getActiveAlerts(location),
    getAlertById: (alertId) => sosRepository.getAlertById(alertId),
    resolveAlert: (alertId, userId) => sosRepository.resolveAlert(alertId, userId),
    respondToAlert: (alertId, responderId, message) =>
      sosRepository.respondToAlert(alertId, responderId, message),
    getAlertHistory: (userId) => sosRepository.getAlertHistory(userId),
    autoResolveStaleAlerts: (minutes) => sosRepository.autoResolveStaleAlerts(minutes),
    claimStaleAlertForResolve: (alertId) => sosRepository.claimStaleAlertForResolve(alertId),
    findAlertsDueForEscalation: (before, take) => sosRepository.findAlertsDueForEscalation(before, take) as any,
    claimAlertForEscalation: (alertId, dueBefore) => sosRepository.claimAlertForEscalation(alertId, dueBefore),
    updateEscalationState: (alertId, data) => sosRepository.updateEscalationState(alertId, data),
    findNotifiedUserIdsForAlert: (alertId) => sosRepository.findNotifiedUserIdsForAlert(alertId),
    getOpenAlertsNearPoint: (latitude, longitude, radiusMeters) =>
      sosRepository.getOpenAlertsNearPoint(latitude, longitude, radiusMeters),
    cancelAlert: (alertId, userId) => sosRepository.cancelAlert(alertId, userId),
  };
}

export function createSosOfferRepositoryAdapter(): SosOfferRepositoryPort {
  return {
    createOffer: async (params) => {
      try {
        return (await sosSessionRepository.createOffer(params)) as any;
      } catch (err) {
        if (err instanceof sosSessionRepository.AlreadyOfferedError) throw new AlreadyOfferedError(err.message);
        throw err;
      }
    },
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
    declineAlert: async (params) => {
      try {
        return (await sosSessionRepository.declineAlert(params)) as any;
      } catch (err) {
        if (err instanceof sosSessionRepository.AlreadyOfferedError) throw new AlreadyOfferedError(err.message);
        throw err;
      }
    },
    findRespondedAlertIds: (responderId, alertIds) =>
      sosSessionRepository.findRespondedAlertIds(responderId, alertIds),
    expireOpenOffersForAlert: (alertId) => sosSessionRepository.expireOpenOffersForAlert(alertId),
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
    findActiveHelperUserIds: (userIds) => sosSessionRepository.findActiveHelperUserIds(userIds),
    countSessionsForHelperSince: (helperId, since) => sosSessionRepository.countSessionsForHelperSince(helperId, since),
    countActiveSessionsForHelper: (helperId) => sosSessionRepository.countActiveSessionsForHelper(helperId),
    listActiveSessionsForHelper: (helperId) => sosSessionRepository.listActiveSessionsForHelper(helperId),
    listHistorySessionsForHelper: (helperId) => sosSessionRepository.listHistorySessionsForHelper(helperId),
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
    setReceiveSosAlerts: (userId, enabled) => riderLocationRepository.setReceiveSosAlerts(userId, enabled),
    getReceiveSosAlerts: (userId) => riderLocationRepository.getReceiveSosAlerts(userId),
  };
}

export function createPartnerDispatchAdapter(): PartnerDispatchPort {
  return {
    // `options` (type/verifiedOnly) was previously dropped here entirely — findByCity's callers
    // (SOSService.findNearbyPartners, escalation.application.ts) always passed it, but it never
    // reached the repository query, so "Share Mechanic" / "Share Fuel Contact" and the
    // SERVICE_PROVIDERS escalation tier were all silently returning every partner type in the
    // city rather than the one actually requested. Fixed here, not a behavior change to accept.
    async findByCity(city, take = 25, options) {
      const partners = await partnerRepository.findPartnersByCityForDispatch(city, take, options);
      return partners.map((p: {
        userId: string;
        businessName: string;
        type: string;
        contactPerson1Name: string | null;
        contactPerson1Mobile: string | null;
        contactPerson2Name: string | null;
        contactPerson2Mobile: string | null;
        latitude: number | null;
        longitude: number | null;
        user: { id: string; name: string; email: string; phone: string | null };
      }) => ({
        userId: p.userId,
        businessName: p.businessName,
        type: p.type,
        contactPerson1Name: p.contactPerson1Name,
        contactPerson1Mobile: p.contactPerson1Mobile,
        contactPerson2Name: p.contactPerson2Name,
        contactPerson2Mobile: p.contactPerson2Mobile,
        latitude: p.latitude,
        longitude: p.longitude,
        user: {
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          phone: p.user.phone,
        },
      }));
    },
    findEligibleForAlert: ({ latitude, longitude, radiusMeters }) =>
      partnerRepository.findEligiblePartnersNearPoint(latitude, longitude, radiusMeters),
    getEligibilityFields: async (userId) => {
      const row = await partnerRepository.findPartnerEligibilityFields(userId);
      if (!row) return null;
      return { providerId: row.id, verificationStatus: row.verificationStatus, isAvailable: row.isAvailable, isGeneralResponder: row.isGeneralResponder, type: row.type };
    },
  };
}

export function createProviderReviewAdapter(): ProviderReviewPort {
  return {
    addProviderReview: (params: { providerId: string; riderId: string; sessionId: string; rating: number; comment?: string }) =>
      partnerRepository.addProviderReview(params),
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
