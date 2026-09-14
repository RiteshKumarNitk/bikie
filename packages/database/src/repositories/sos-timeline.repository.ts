import { prisma } from "../client";

export async function record(params: {
  alertId: string;
  sessionId?: string;
  type: string;
  actorId?: string;
  metadata?: unknown;
}) {
  await prisma.sOSTimelineEvent.create({
    data: {
      alertId: params.alertId,
      sessionId: params.sessionId,
      type: params.type as any,
      actorId: params.actorId,
      metadata: params.metadata as any,
    },
  });
}

export async function listForAlert(alertId: string) {
  return prisma.sOSTimelineEvent.findMany({
    where: { alertId },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { id: true, name: true } } },
  });
}

/** ADR-085 — cumulative SMS-selection count for one alert, across every escalation batch so far.
 * Reuses the existing `HELPER_OFFERED` event `record()` already writes per dispatch candidate
 * (no new event type, no schema change) — each carries `metadata.sms: true` when that candidate
 * was marked `smsEligible` by `markSmsEligibility`, plus a `candidateId` (the recipient's own
 * `userId`, or a masked-phone fallback for a phone-only recipient with no account, e.g. a
 * partner's secondary contact person — never the raw number). Counts DISTINCT candidateIds so a
 * candidate re-appearing in a later tick's metadata (shouldn't normally happen, since
 * `findNotifiedUserIdsForAlert` already excludes them as a candidate) is never double-counted. */
export async function countSmsSelectedForAlert(alertId: string): Promise<number> {
  const events = await prisma.sOSTimelineEvent.findMany({
    where: { alertId, type: "HELPER_OFFERED" },
    select: { metadata: true },
  });
  const ids = new Set<string>();
  for (const event of events) {
    const metadata = event.metadata as { candidateId?: string; sms?: boolean } | null;
    if (metadata?.sms === true && metadata.candidateId) ids.add(metadata.candidateId);
  }
  return ids.size;
}
