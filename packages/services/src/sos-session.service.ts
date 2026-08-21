import { getSafetyLocationModule } from "./modules/safety-location/public";

/** Compatibility facade — helper-offer/session logic lives in safety-location's session application. */
export const SOSSessionService = {
  offerHelp(
    alertId: string,
    responderId: string,
    location?: { latitude: number; longitude: number },
    message?: string,
    opts?: { requireAvailableAndCapacity?: boolean },
  ) {
    return getSafetyLocationModule().session.offerHelp(alertId, responderId, location, message, opts);
  },
  withdrawOffer(offerId: string, responderId: string) {
    return getSafetyLocationModule().session.withdrawOffer(offerId, responderId);
  },
  declineAlert(alertId: string, responderId: string, message?: string) {
    return getSafetyLocationModule().session.declineAlert(alertId, responderId, message);
  },
  listOffers(alertId: string, actorId: string, isAdmin: boolean) {
    return getSafetyLocationModule().session.listOffers(alertId, actorId, isAdmin);
  },
  acceptOffer(alertId: string, offerId: string, actorId: string, isAdmin: boolean) {
    return getSafetyLocationModule().session.acceptOffer(alertId, offerId, actorId, isAdmin);
  },
  rejectOffer(alertId: string, offerId: string, actorId: string, isAdmin: boolean) {
    return getSafetyLocationModule().session.rejectOffer(alertId, offerId, actorId, isAdmin);
  },
  getSession(sessionId: string, actorId: string, isAdmin: boolean) {
    return getSafetyLocationModule().session.getSession(sessionId, actorId, isAdmin);
  },
  getActiveSessionForAlert(alertId: string) {
    return getSafetyLocationModule().ports.sosSessions.getActiveSessionForAlert(alertId);
  },
  updateSessionStatus(
    sessionId: string,
    status: "HELPER_ARRIVED" | "ASSISTANCE_IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    actorId: string,
    isAdmin: boolean,
    cancelReason?: string,
  ) {
    return getSafetyLocationModule().session.updateSessionStatus(sessionId, status, actorId, isAdmin, cancelReason);
  },
  submitRating(sessionId: string, riderId: string, rating: number, comment?: string) {
    return getSafetyLocationModule().session.submitRating(sessionId, riderId, rating, comment);
  },
  // --- ADR-044: partner Emergency Assistance Dashboard ---
  getPartnerDashboard(userId: string, location?: { latitude: number; longitude: number }) {
    return getSafetyLocationModule().partnerDashboard.getDashboard(userId, location);
  },
  listNearbyOpenRequests(userId: string, location: { latitude: number; longitude: number }) {
    return getSafetyLocationModule().partnerDashboard.listNearbyOpenRequests(userId, location);
  },
  listPendingOffers(userId: string) {
    return getSafetyLocationModule().partnerDashboard.listPendingOffers(userId);
  },
  listActiveAssistance(userId: string) {
    return getSafetyLocationModule().partnerDashboard.listActiveAssistance(userId);
  },
  // --- ADR-046b: Completed Assistance / Assistance History ---
  listHistory(userId: string) {
    return getSafetyLocationModule().partnerDashboard.listHistory(userId);
  },
};
