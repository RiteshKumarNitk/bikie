import { getSafetyLocationModule } from "./modules/safety-location/public";

/** Compatibility facade — helper-offer/session logic lives in safety-location's session application. */
export const SOSSessionService = {
  offerHelp(alertId: string, responderId: string, location?: { latitude: number; longitude: number }, message?: string) {
    return getSafetyLocationModule().session.offerHelp(alertId, responderId, location, message);
  },
  withdrawOffer(offerId: string, responderId: string) {
    return getSafetyLocationModule().session.withdrawOffer(offerId, responderId);
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
};
