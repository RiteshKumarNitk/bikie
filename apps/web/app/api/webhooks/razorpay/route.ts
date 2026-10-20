import { NextResponse } from "next/server";
import { PartnerMembershipService, RazorpayService } from "@bikie/services";

/** Terminal/informational Razorpay Subscription statuses — `status`/`endDate` are deliberately
 * NOT touched for these: "do not incorrectly mark an otherwise valid active period as expired
 * unless the actual membership period has ended" — the existing `endDate` check already enforces
 * that with no extra write needed here. */
const STATUS_ONLY_EVENTS = new Set([
  "subscription.pending",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
]);

interface RazorpaySubscriptionEntity {
  id: string;
  status: string;
  plan_id?: string;
  current_start?: number | null;
  current_end?: number | null;
}

interface RazorpayPaymentEntity {
  id: string;
  amount: number;
}

interface RazorpayWebhookPayload {
  id?: string;
  event: string;
  payload?: {
    subscription?: { entity: RazorpaySubscriptionEntity };
    payment?: { entity: RazorpayPaymentEntity };
  };
}

function toDate(unixSeconds: number | null | undefined): Date | null {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000) : null;
}

/**
 * `POST /api/webhooks/razorpay` — Razorpay Subscriptions webhook (recurring SP membership).
 * Reads the RAW body (required for signature verification — Razorpay signs the exact bytes it
 * sent, not a re-serialized object), verifies `X-Razorpay-Signature` against
 * `RAZORPAY_WEBHOOK_SECRET` (never `RAZORPAY_KEY_SECRET` — a different secret, by Razorpay's own
 * design), and makes processing idempotent by the event's own id (`PartnerMembershipService.
 * claimWebhookEvent`) before touching anything — a replayed/duplicate delivery is a no-op 200.
 *
 * Every branch returns 200 once the event is understood (even "nothing to do" ones) so Razorpay
 * doesn't retry forever; only a bad signature or a malformed body get a non-200.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !RazorpayService.verifyWebhookSignature(rawBody, signature)) {
    console.error("[Webhook][Razorpay] signature verification failed — rejecting");
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const eventId = body.id ?? null;
  const eventType = body.event;
  if (!eventId) {
    // Every real Razorpay webhook delivery carries an `id` — this should never happen with a
    // genuinely signed payload, but idempotency has nothing to key on without it.
    console.error(`[Webhook][Razorpay] event has no id, cannot dedupe — eventType=${eventType}`);
    return NextResponse.json({ error: "MISSING_EVENT_ID" }, { status: 400 });
  }

  console.log(`SUBSCRIPTION_WEBHOOK_RECEIVED razorpayEventId=${eventId} eventType=${eventType}`);
  const claimed = await PartnerMembershipService.claimWebhookEvent(eventId, eventType);
  if (!claimed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const subscription = body.payload?.subscription?.entity;
  if (!subscription) {
    console.log(`SUBSCRIPTION_WEBHOOK_IGNORED razorpayEventId=${eventId} eventType=${eventType} reason=NO_SUBSCRIPTION_ENTITY`);
    return NextResponse.json({ ok: true });
  }

  try {
    if (eventType === "subscription.charged") {
      const payment = body.payload?.payment?.entity;
      if (!payment) {
        console.error(`SUBSCRIPTION_WEBHOOK_FAILED razorpayEventId=${eventId} eventType=${eventType} reason=NO_PAYMENT_ENTITY`);
        return NextResponse.json({ ok: true });
      }
      await PartnerMembershipService.recordRecurringCharge(subscription.id, {
        subscriptionStatus: subscription.status,
        currentPeriodStart: toDate(subscription.current_start),
        currentPeriodEnd: toDate(subscription.current_end) ?? new Date(),
        razorpayPaymentId: payment.id,
        amount: payment.amount / 100,
      });
    } else if (eventType === "subscription.activated") {
      // Razorpay sometimes bundles the first authorization charge with `activated`; when it
      // does, treat it exactly like `charged` (idempotent on `razorpayPaymentId` either way, so
      // a later `charged` for the same payment is a safe no-op). Otherwise, status-only.
      const payment = body.payload?.payment?.entity;
      if (payment) {
        await PartnerMembershipService.recordRecurringCharge(subscription.id, {
          subscriptionStatus: subscription.status,
          currentPeriodStart: toDate(subscription.current_start),
          currentPeriodEnd: toDate(subscription.current_end) ?? new Date(),
          razorpayPaymentId: payment.id,
          amount: payment.amount / 100,
        });
      } else {
        await PartnerMembershipService.recordSubscriptionStatusChange(subscription.id, subscription.status);
      }
    } else if (STATUS_ONLY_EVENTS.has(eventType)) {
      await PartnerMembershipService.recordSubscriptionStatusChange(subscription.id, subscription.status, {
        // Only Razorpay-initiated cancellation stamps `cancelledAt` here — this app's own
        // `/subscription/cancel` already stamped it at request time.
        ...(eventType === "subscription.cancelled" ? { cancelledAt: new Date() } : {}),
      });
    } else {
      console.log(`SUBSCRIPTION_WEBHOOK_IGNORED razorpayEventId=${eventId} eventType=${eventType} reason=UNHANDLED_EVENT_TYPE`);
    }
  } catch (err) {
    // The event is already claimed (dedup row inserted) — a processing failure here is logged,
    // not retried by re-delivering, since Razorpay's own retry would hit the dedup gate above and
    // no-op. Never throw back to Razorpay as a 5xx for a transient internal error; the SOS/
    // eligibility impact of a missed extension is bounded (the provider simply doesn't regain
    // eligibility until the operator investigates the error log).
    console.error(`SUBSCRIPTION_WEBHOOK_FAILED razorpayEventId=${eventId} eventType=${eventType} error=${String(err).slice(0, 300)}`);
  }

  return NextResponse.json({ ok: true });
}
