import type { SOSAlertCreateInput, SOSAlertDTO } from "@bikie/types";
import { isPrivilegedViewer, redactAlertForViewer, type RawSOSAlertDTO } from "../domain/pii-redaction";
import { deriveSeverity } from "../domain/severity";
import type { SafetyLocationPorts, SosLocationFilter } from "../ports";

const INITIAL_RADIUS_METERS = 5000;

/** ADR-045 — the caller's identity, used to decide how much of each alert they get to see.
 * Required (not optional) on every read below — redaction must never silently default to
 * "show everything" just because a caller forgot to pass it. */
export type AlertViewer = { userId: string; isAdmin: boolean };

export function createSosApplication(ports: SafetyLocationPorts) {
  return {
    async createAlert(userId: string, data: SOSAlertCreateInput): Promise<RawSOSAlertDTO> {
      // Best-effort (ADR-038): a failed/timed-out lookup must never block sending the alert —
      // every downstream reader (dispatch text, UI) already falls back to city/raw coordinates
      // when these come back null.
      const geocoded = await ports.geocoding.reverseGeocode(data.latitude, data.longitude).catch(() => null);

      return ports.sosAlerts.createAlert({
        userId,
        ...data,
        severity: deriveSeverity(data.type),
        currentRadiusMeters: INITIAL_RADIUS_METERS,
        // Set to the real value by escalation.seedEscalation() right after creation — the
        // repository just needs a non-throwing value at insert time.
        nextEscalationAt: null,
        placeName: geocoded?.placeName ?? null,
        area: geocoded?.area ?? null,
        formattedAddress: geocoded?.formattedAddress ?? null,
      });
    },

    async getActiveAlerts(location: SosLocationFilter | undefined, viewer: AlertViewer): Promise<SOSAlertDTO[]> {
      const alerts = await ports.sosAlerts.getActiveAlerts(location);
      return alerts.map((alert) => redactAlertForViewer(alert, isPrivilegedViewer(alert, viewer)));
    },

    /** A rider's own currently-open alerts — for surfacing "your active SOS alert" on Home,
     * independent of whether they've shared their location (`getActiveAlerts` above requires it
     * and returns the whole nearby community, the wrong shape for this). Never redacted: a
     * reporter is always the privileged viewer of their own alert. */
    async getMyActiveAlerts(userId: string): Promise<SOSAlertDTO[]> {
      const alerts = await ports.sosAlerts.getActiveAlertsForReporter(userId);
      return alerts.map((alert) => redactAlertForViewer(alert, isPrivilegedViewer(alert, { userId, isAdmin: false })));
    },

    async getAlertById(alertId: string, viewer: AlertViewer): Promise<SOSAlertDTO | null> {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return null;
      return redactAlertForViewer(alert, isPrivilegedViewer(alert, viewer));
    },

    /**
     * Only the reporter, the assigned helper, or an admin may resolve an alert — resolving is
     * a claim that the emergency is over, and a bystander marking someone else's alert resolved
     * would hide it from responders. Checked here (not just at the route) so Flutter, which
     * calls through the same application method, can't bypass it either.
     */
    async resolveAlert(alertId: string, userId: string, isAdmin: boolean) {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return { ok: false as const, reason: "NOT_FOUND" as const };
      const isOwner = alert.userId === userId;
      const isAssignedHelper = alert.assignedHelperId === userId;
      if (!isOwner && !isAssignedHelper && !isAdmin) return { ok: false as const, reason: "FORBIDDEN" as const };

      await ports.sosAlerts.resolveAlert(alertId, userId);
      await ports.sosTimeline.record({ alertId, type: "SOS_RESOLVED", actorId: userId });

      // Notify whichever party didn't do the resolving — the one who did already knows.
      // An admin override notifies both.
      const recipients = new Set<string>();
      if (!isOwner || isAdmin) recipients.add(alert.userId);
      if (alert.assignedHelperId && (!isAssignedHelper || isAdmin)) recipients.add(alert.assignedHelperId);
      await Promise.all(
        [...recipients].map((recipientId) =>
          ports.notifications
            .notify(recipientId, "SOS_ALERT", "SOS closed", "This SOS alert has been marked resolved.", "sos_alert", alertId)
            .catch(console.error),
        ),
      );

      return { ok: true as const };
    },

    /** §28 — the reporter (or an admin) cancels an SOS while it's being dispatched. Stops the
     * dispatch (nextEscalationAt is cleared), expires every outstanding offer, ends an already-
     * assigned helper's active session if one exists ("already assigned → appropriate
     * cancellation flow" — the provider is never left travelling to a cancelled emergency), and
     * records the SOS_CANCELLED timeline event. Everyone who was mid-response gets told the
     * request is no longer available.
     */
    async cancelAlert(alertId: string, userId: string, isAdmin: boolean, reason?: string) {
      const alert = await ports.sosAlerts.getAlertById(alertId);
      if (!alert) return { ok: false as const, reason: "NOT_FOUND" as const };
      if (alert.userId !== userId && !isAdmin) return { ok: false as const, reason: "FORBIDDEN" as const };
      if (alert.status !== "ACTIVE") return { ok: false as const, reason: "ALERT_NOT_ACTIVE" as const };

      const assignedHelperId = alert.assignedHelperId;
      if (assignedHelperId) {
        const session = await ports.sosSessions.getActiveSessionForAlert(alertId).catch(() => null);
        if (session) {
          await ports.sosSessions
            .updateSessionStatus(session.id, "CANCELLED", reason ?? "SOS cancelled by rider")
            .catch(() => undefined);
        }
      }

      const expiredResponderIds = await ports.sosOffers.expireOpenOffersForAlert(alertId);
      const cancelled = await ports.sosAlerts.cancelAlert(alertId, userId);
      if (cancelled === 0) return { ok: false as const, reason: "ALERT_NOT_ACTIVE" as const };

      await ports.sosTimeline.record({
        alertId,
        type: "SOS_CANCELLED",
        actorId: userId,
        metadata: { reason: reason ?? null, expiredOffers: expiredResponderIds.length },
      });

      const recipients = new Set<string>();
      if (assignedHelperId) recipients.add(assignedHelperId);
      for (const id of expiredResponderIds) recipients.add(id);
      await Promise.all(
        [...recipients].map((recipientId) =>
          ports.notifications
            .notify(
              recipientId,
              "SOS_ALERT",
              "SOS cancelled",
              "This SOS request was cancelled by the rider and is no longer available.",
              "sos_alert",
              alertId,
            )
            .catch(console.error),
        ),
      );

      return { ok: true as const };
    },

    /** Deprecated alias target — kept only for the old /respond route (ADR-028: no facade
     * deletion without zero-use proof). New callers should use the session application's
     * offerHelp instead. */
    respondToAlert(alertId: string, responderId: string, message?: string) {
      return ports.sosAlerts.respondToAlert(alertId, responderId, message);
    },

    getAlertHistory(userId: string) {
      return ports.sosAlerts.getAlertHistory(userId);
    },

    /**
     * Cascades cleanup for stale alerts instead of a raw bulk update, so the timeline actually
     * captures why each one closed and any dangling active session doesn't linger assigned to
     * a helper who never followed through. Resolves each alert (`claimStaleAlertForResolve`)
     * BEFORE cascading side effects, not after — see that port method's doc comment for why.
     */
    async autoResolveStaleAlerts(minutes: number): Promise<void> {
      const stale = await ports.sosAlerts.autoResolveStaleAlerts(minutes);
      if (stale.length === 0) return;

      await Promise.all(
        stale.map(async ({ id: alertId, userId, assignedHelperId }) => {
          // Atomic claim FIRST — resolving before cascading side effects (not after, as before)
          // means two overlapping cron runs can't both cancel the session / record the timeline
          // event / notify for the same alert. A false claim is always a safe no-op: someone else
          // already resolved it in the meantime.
          const claimed = await ports.sosAlerts.claimStaleAlertForResolve(alertId);
          if (!claimed) return;

          const session = await ports.sosSessions.getActiveSessionForAlert(alertId).catch(() => null);
          if (session) {
            await ports.sosSessions
              .updateSessionStatus(session.id, "CANCELLED", "SOS auto-resolved (timed out)")
              .catch(() => undefined);
          }
          await ports.sosTimeline.record({ alertId, type: "SOS_RESOLVED", metadata: { reason: "auto-resolve-timeout" } });

          const recipients = assignedHelperId ? [userId, assignedHelperId] : [userId];
          await Promise.all(
            recipients.map((recipientId) =>
              ports.notifications
                .notify(
                  recipientId,
                  "SOS_ALERT",
                  "SOS closed",
                  "This SOS alert was automatically closed after 2 hours of inactivity.",
                  "sos_alert",
                  alertId,
                )
                .catch(console.error),
            ),
          );
        }),
      );
    },

    /**
     * Warn the reporter about gaps that make an SOS less effective: responders can't call them
     * back without a phone number, and with no emergency contacts saved the fan-out has nobody
     * guaranteed to reach (nearby riders depend on who happens to be sharing location).
     */
    async getProfileWarning(userId: string): Promise<string | null> {
      const [user, contacts] = await Promise.all([
        ports.userContact.findSosContactFields(userId),
        ports.emergencyContacts.findByUserId(userId).catch(() => []),
      ]);

      const missingFields: string[] = [];
      if (!user?.phone) missingFields.push("phone number");
      if (contacts.length === 0) missingFields.push("emergency contacts");
      if (missingFields.length === 0) return null;
      return `Your profile is missing: ${missingFields.join(", ")}. Update your profile so responders can reach you.`;
    },
  };
}

export type SosApplication = ReturnType<typeof createSosApplication>;
