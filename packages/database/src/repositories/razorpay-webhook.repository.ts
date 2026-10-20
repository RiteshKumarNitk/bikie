import { prisma } from "../client";
import { isUniqueViolation } from "../lib/prisma-errors";

/**
 * Idempotency ledger for `POST /api/webhooks/razorpay` (recurring-subscriptions feature) — one
 * row per Razorpay webhook event id, inserted BEFORE the event is acted on. A unique-violation on
 * `razorpayEventId` means this exact event was already processed (a Razorpay retry, or two
 * concurrent deliveries); the caller treats that as "nothing to do," never re-applying the
 * event's side effects. Same "insert wins the race" idempotency pattern
 * `partner-membership.repository.ts`'s `createMembership` already uses for payment references.
 */
export async function tryClaimEvent(razorpayEventId: string, eventType: string): Promise<boolean> {
  try {
    await prisma.razorpayWebhookEvent.create({ data: { razorpayEventId, eventType } });
    return true;
  } catch (err) {
    if (isUniqueViolation(err)) return false;
    throw err;
  }
}
