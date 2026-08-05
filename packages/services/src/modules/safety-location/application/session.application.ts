import { estimateEtaMinutes, haversineDistanceMeters } from "../domain/eta";
import { getReputationModule, type ReputationApplication } from "../../reputation/public";
import { AlreadyAssignedError, AlreadyOfferedError, OfferNotAvailableError, type SafetyLocationPorts } from "../ports";

export type SessionApplicationDeps = { reputation?: ReputationApplication };

export function createSessionApplication(ports: SafetyLocationPorts, deps: SessionApplicationDeps = {}) {
  const reputation = deps.reputation ?? getReputationModule().reputation;

  return {
    /** Helper taps "I'm Coming." */
    async offerHelp(
      alertId: string,
      responderId: string,
      location?: { latitude: number; longitude: number },
      message?: string,
    ) {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (alert.status !== "ACTIVE") return { ok: false as const, reason: "ALERT_NOT_ACTIVE" as const };
      if (alert.assignedHelperId) return { ok: false as const, reason: "ALREADY_ASSIGNED" as const };
      if (alert.userId === responderId) return { ok: false as const, reason: "FORBIDDEN" as const };

      let distanceMeters: number | undefined;
      let etaMinutes: number | undefined;
      if (location) {
        distanceMeters = Math.round(
          haversineDistanceMeters(alert.latitude, alert.longitude, location.latitude, location.longitude),
        );
        etaMinutes = estimateEtaMinutes(distanceMeters);
      }

      let offer;
      try {
        offer = await ports.sosOffers.createOffer({ alertId, responderId, distanceMeters, etaMinutes, message });
      } catch (err) {
        if (err instanceof AlreadyOfferedError) return { ok: false as const, reason: "ALREADY_OFFERED" as const };
        throw err;
      }
      await ports.sosTimeline.record({
        alertId,
        type: "HELPER_OFFERED",
        actorId: responderId,
        metadata: { offerId: offer.id, distanceMeters, etaMinutes },
      });
      await ports.notifications
        .notify(
          alert.userId,
          "SOS_ALERT",
          "Someone offered to help",
          `${offer.responder.name} is ${distanceMeters ? `~${Math.round(distanceMeters / 100) / 10}km` : "nearby"} away and wants to help. Review their offer in Dashboard → SOS.`,
          "sos_alert",
          alertId,
        )
        .catch(console.error);

      return { ok: true as const, offer };
    },

    /** Helper taps "Cannot Help" on their own offer. */
    async withdrawOffer(offerId: string, responderId: string) {
      try {
        await ports.sosOffers.withdrawOffer(offerId, responderId);
        return { ok: true as const };
      } catch (err) {
        if (err instanceof OfferNotAvailableError) return { ok: false as const, reason: "OFFER_NOT_AVAILABLE" as const };
        throw err;
      }
    },

    async listOffers(alertId: string, actorId: string, isAdmin: boolean) {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (alert.userId !== actorId && !isAdmin) return { ok: false as const, reason: "FORBIDDEN" as const };
      const offers = await ports.sosOffers.listOffersForAlert(alertId);
      return { ok: true as const, offers };
    },

    /** Rider (or admin) accepts a specific helper's offer — the transactional assignment. */
    async acceptOffer(alertId: string, offerId: string, actorId: string, isAdmin: boolean) {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (alert.userId !== actorId && !isAdmin) return { ok: false as const, reason: "FORBIDDEN" as const };

      try {
        const session = await ports.sosSessions.acceptOffer({ alertId, offerId, actorId });
        await ports.notifications
          .notify(session.helperId, "SOS_ALERT", "You're confirmed", "The rider accepted your offer to help. Open the SOS session to chat and navigate.", "sos_session", session.id)
          .catch(console.error);
        return { ok: true as const, session };
      } catch (err) {
        if (err instanceof AlreadyAssignedError) return { ok: false as const, reason: "ALREADY_ASSIGNED" as const };
        if (err instanceof OfferNotAvailableError) return { ok: false as const, reason: "OFFER_NOT_AVAILABLE" as const };
        throw err;
      }
    },

    /** Rider (or admin) rejects a specific helper's offer without assigning them. */
    async rejectOffer(alertId: string, offerId: string, actorId: string, isAdmin: boolean) {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (alert.userId !== actorId && !isAdmin) return { ok: false as const, reason: "FORBIDDEN" as const };

      try {
        await ports.sosOffers.rejectOffer(alertId, offerId, actorId);
        await ports.sosTimeline.record({ alertId, type: "HELPER_REJECTED", actorId, metadata: { offerId } });
        return { ok: true as const };
      } catch (err) {
        if (err instanceof OfferNotAvailableError) return { ok: false as const, reason: "OFFER_NOT_AVAILABLE" as const };
        throw err;
      }
    },

    async getSession(sessionId: string, actorId: string, isAdmin: boolean) {
      const session = await ports.sosSessions.getSessionById(sessionId);
      if (!session) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (session.helperId !== actorId && session.riderId !== actorId && !isAdmin) {
        return { ok: false as const, reason: "FORBIDDEN" as const };
      }
      return { ok: true as const, session };
    },

    /**
     * Status ownership rule (flagged as a product decision, not purely architectural, when this
     * was planned): the helper drives ARRIVED/ASSISTANCE_IN_PROGRESS (they're the one physically
     * there to say so), the rider drives COMPLETED (confirming the emergency is actually over),
     * and either party can CANCELLED. Admins can always override.
     */
    async updateSessionStatus(
      sessionId: string,
      status: "HELPER_ARRIVED" | "ASSISTANCE_IN_PROGRESS" | "COMPLETED" | "CANCELLED",
      actorId: string,
      isAdmin: boolean,
      cancelReason?: string,
    ) {
      const session = await ports.sosSessions.getSessionById(sessionId);
      if (!session) return { ok: false as const, reason: "NOT_FOUND" as const };
      const isHelper = session.helperId === actorId;
      const isRider = session.riderId === actorId;
      if (!isHelper && !isRider && !isAdmin) return { ok: false as const, reason: "FORBIDDEN" as const };

      const helperOnly = status === "HELPER_ARRIVED" || status === "ASSISTANCE_IN_PROGRESS";
      const riderOnly = status === "COMPLETED";
      if (!isAdmin) {
        if (helperOnly && !isHelper) return { ok: false as const, reason: "FORBIDDEN" as const };
        if (riderOnly && !isRider) return { ok: false as const, reason: "FORBIDDEN" as const };
      }

      const updated = await ports.sosSessions.updateSessionStatus(sessionId, status, cancelReason);
      const eventType =
        status === "HELPER_ARRIVED"
          ? "HELPER_ARRIVED"
          : status === "ASSISTANCE_IN_PROGRESS"
            ? "ASSISTANCE_STARTED"
            : status === "COMPLETED"
              ? "ASSISTANCE_COMPLETED"
              : "SOS_CANCELLED";
      await ports.sosTimeline.record({ alertId: updated.alertId, sessionId, type: eventType, actorId });

      if (status === "COMPLETED") {
        await reputation.recordAssist(updated.helperId).catch(console.error);
      }

      const notifyUserId = isHelper ? updated.riderId : updated.helperId;
      const label =
        status === "HELPER_ARRIVED"
          ? "Your helper has arrived"
          : status === "ASSISTANCE_IN_PROGRESS"
            ? "Assistance has started"
            : status === "COMPLETED"
              ? "Assistance marked complete"
              : "The SOS session was cancelled";
      await ports.notifications.notify(notifyUserId, "SOS_ALERT", label, label, "sos_session", sessionId).catch(console.error);

      return { ok: true as const, session: updated };
    },

    async submitRating(sessionId: string, riderId: string, rating: number, comment?: string) {
      const session = await ports.sosSessions.getSessionById(sessionId);
      if (!session) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (session.riderId !== riderId) return { ok: false as const, reason: "FORBIDDEN" as const };
      if (session.status !== "COMPLETED") return { ok: false as const, reason: "SESSION_NOT_COMPLETED" as const };
      if (session.rating != null) return { ok: false as const, reason: "ALREADY_RATED" as const };
      if (rating < 1 || rating > 5) return { ok: false as const, reason: "INVALID_RATING" as const };

      await ports.sosSessions.submitRating(sessionId, rating, comment);
      await ports.sosTimeline.record({ alertId: session.alertId, sessionId, type: "RATING_SUBMITTED", actorId: riderId, metadata: { rating } });
      await reputation.recordRating(session.helperId, rating).catch(console.error);
      return { ok: true as const };
    },
  };
}

export type SessionApplication = ReturnType<typeof createSessionApplication>;
