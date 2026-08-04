import type { SOSAlertDTO } from "@bikie/types";
import { getPlatformModule } from "../../platform/public";
import { resolveChannelAvailability } from "../domain/channel-selection";
import type { SOSRecipient } from "../domain/dispatch-message";
import type { SafetyLocationPorts } from "../ports";
import {
  createFanOutApplication,
  dispatchToRecipient,
  emptySummary,
  mergeSummaries,
  resolveEscalationRecipients,
  type FanOutDeps,
  type SOSDispatchSummary,
} from "./fan-out.application";
import { createEscalationApplication } from "./escalation.application";

const SOS_DISPATCH_IDEMPOTENCY_TTL_SECONDS = 86_400;

/**
 * Orchestrates SOS creation's two immediate legs (emergency contacts/services, and tier-1
 * nearby riders) into the one summary the API response and success screen render, then decides
 * whether the combined result is "zero recipients anywhere" and needs an immediate admin
 * escalation (ADR-030's guarantee, preserved across the ADR-033 staging change — see
 * fan-out.application.ts's doc comment on why this check moved here).
 *
 * Owns the idempotency claim for the WHOLE combined flow — it has to span both legs, since a
 * retried create-alert request must not double-notify either one.
 */
export function createDispatchOrchestrator(ports: SafetyLocationPorts) {
  const fanOutApp = createFanOutApplication(ports);
  const escalationApp = createEscalationApplication(ports);

  return {
    async fanOut(alert: SOSAlertDTO, deps: FanOutDeps = {}): Promise<SOSDispatchSummary> {
      const communications = deps.communications ?? ports.communications;
      const idempotency = deps.idempotency ?? getPlatformModule().ports.idempotency;
      const idemKey = `sos-dispatch:${alert.id}`;

      const claimed = await idempotency.claim(idemKey, SOS_DISPATCH_IDEMPOTENCY_TTL_SECONDS);
      if (!claimed) {
        const cached = await idempotency.recall<SOSDispatchSummary>(idemKey);
        if (cached) return cached;
        // In-flight duplicate — skip side effects; return an empty accounting summary.
        return emptySummary(resolveChannelAvailability(communications));
      }

      const [contactsSummary, escalationResult] = await Promise.all([
        fanOutApp.fanOut(alert, deps),
        escalationApp.seedEscalation(alert, deps),
      ]);

      let summary = mergeSummaries(contactsSummary, escalationResult.summary);
      const respondersFound = summary.emergencyContacts + summary.emergencyServices + escalationResult.nearbyRiderCount;

      if (respondersFound === 0) {
        const availability = resolveChannelAvailability(communications);
        const admins = await resolveEscalationRecipients(ports);
        const adminSummary = emptySummary(availability);
        await Promise.all(
          admins.map((r: SOSRecipient) => dispatchToRecipient(alert, r, adminSummary, communications, ports, availability)),
        );
        adminSummary.escalatedToAdmins = admins.length;
        summary = mergeSummaries(summary, adminSummary);

        await ports.sosTimeline.record({ alertId: alert.id, type: "ESCALATED_ADMIN", metadata: { notified: admins.length, immediate: true } });
        await ports.sosAlerts.updateEscalationState(alert.id, { escalationTier: "ADMIN", nextEscalationAt: null });
        console.error(
          `[SOS][DISPATCH][NO-RECIPIENTS] alert=${alert.id} city=${alert.city} — no nearby riders, ` +
            `emergency contacts, or emergency-services contact configured; escalated to ${admins.length} admin(s) immediately.`,
        );
      }

      await ports.notifications
        .notify(
          alert.userId,
          "SOS_ALERT",
          "Your SOS alert is live",
          respondersFound > 0
            ? `Alerting ${respondersFound} responder(s) in ${alert.city}. Track responses in Dashboard → SOS.`
            : `No responders could be reached in ${alert.city}. Add emergency contacts in your profile and call local emergency services now.`,
          "sos_alert",
          alert.id,
        )
        .catch(console.error);

      console.log(
        `[SOS][DISPATCH] alert=${alert.id} nearby=${summary.nearbyRiders} contacts=${summary.emergencyContacts} ` +
          `sms=${summary.smsSent}/${summary.smsAttempted} wa=${summary.whatsappSent}/${summary.whatsappAttempted} ` +
          `email=${summary.emailSent}/${summary.emailAttempted} inApp=${summary.inAppNotified} admins=${summary.escalatedToAdmins}`,
      );

      await idempotency.remember(idemKey, summary, SOS_DISPATCH_IDEMPOTENCY_TTL_SECONDS);
      return summary;
    },
  };
}

export type DispatchOrchestrator = ReturnType<typeof createDispatchOrchestrator>;
