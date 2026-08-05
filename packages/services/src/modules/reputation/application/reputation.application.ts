import type { ReputationPorts } from "../ports";

/**
 * Minimal SOS-helper reputation (ADR-033 Phase D) — counters + rating only. Deliberately no
 * badges/trust-tier here (client's explicit call, ADR-010 precedent of deferring general
 * reputation systems). Never client-writable — only called from session.application.ts on
 * session completion / rating submission.
 */
export function createReputationApplication(ports: ReputationPorts) {
  return {
    recordAssist(userId: string) {
      return ports.reputation.recordAssist(userId);
    },
    recordRating(userId: string, rating: number) {
      return ports.reputation.recordRating(userId, rating);
    },
    getStats(userId: string) {
      return ports.reputation.getStats(userId);
    },
  };
}

export type ReputationApplication = ReturnType<typeof createReputationApplication>;
