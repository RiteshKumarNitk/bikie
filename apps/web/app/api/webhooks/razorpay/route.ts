import { NextResponse } from "next/server";
import { MembershipService, PartnerMembershipService, RazorpayService, SubscriptionWebhookRouter } from "@bikie/services";

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
 * `POST /api/webhooks/razorpay` — Razorpay Subscriptions webhook, shared by BOTH recurring
 * membership types: Rider (₹149/year, `UserMembership`) and Service Provider (₹99/month,
 * `PartnerMembership`) — one webhook URL/secret registered once in the Razorpay Dashboard,
 * `SubscriptionWebhookRouter.resolveAccountType` decides which service a given event belongs to
 * by looking up the subscription id against both tables (their `razorpaySubscriptionId` columns
 * are independently unique, so at most one matches). Reads the RAW body (required for signature
 * verification — Razorpay signs the exact bytes it sent, not a re-serialized object), verifies
 * `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET` (never `RAZORPAY_KEY_SECRET` — a
 * different secret, by Razorpay's own design), and makes processing idempotent by the event's own
 * id (`PartnerMembershipService.claimWebhookEvent` — shared/generic despite living on that
 * service, not SP-specific) before touching anything — a replayed/duplicate delivery is a no-op
 * 200.
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

  // Razorpay's webhook JSON body has NO `id` field of its own (its shape is `{ entity, account_id,
  // event, contains, payload, created_at }`) — the real per-delivery unique identifier is sent in
  // the `X-Razorpay-Event-Id` HTTP header instead. `body.id` is kept as a defensive fallback only
  // (never actually populated by a real delivery); relying on it alone meant every single webhook
  // call, for every event type, failed `MISSING_EVENT_ID` before anything else ran — the root
  // cause of memberships never auto-activating and always needing manual reconciliation.
  const eventId = request.headers.get("x-razorpay-event-id") ?? body.id ?? null;
  const eventType = body.event;
  if (!eventId) {
    console.error(`[Webhook][Razorpay] event has no id (header or body), cannot dedupe — eventType=${eventType}`);
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
    const accountType = await SubscriptionWebhookRouter.resolveAccountType(subscription.id);
    if (!accountType) {
      // A genuinely signed Razorpay event referencing a subscription id neither table has —
      // shouldn't normally happen, but there's nothing to update either way. Still 200s so
      // Razorpay doesn't retry forever.
      console.error(
        `SUBSCRIPTION_WEBHOOK_UNKNOWN_SUBSCRIPTION razorpayEventId=${eventId} eventType=${eventType} razorpaySubscriptionId=${subscription.id}`,
      );
      return NextResponse.json({ ok: true });
    }
    const service = accountType === "RIDER" ? MembershipService : PartnerMembershipService;

    if (eventType === "subscription.charged") {
      const payment = body.payload?.payment?.entity;
      if (!payment) {
        console.error(`SUBSCRIPTION_WEBHOOK_FAILED razorpayEventId=${eventId} eventType=${eventType} reason=NO_PAYMENT_ENTITY`);
        return NextResponse.json({ ok: true });
      }
      await service.recordRecurringCharge(subscription.id, {
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
        await service.recordRecurringCharge(subscription.id, {
          subscriptionStatus: subscription.status,
          currentPeriodStart: toDate(subscription.current_start),
          currentPeriodEnd: toDate(subscription.current_end) ?? new Date(),
          razorpayPaymentId: payment.id,
          amount: payment.amount / 100,
        });
      } else {
        await service.recordSubscriptionStatusChange(subscription.id, subscription.status);
      }
    } else if (STATUS_ONLY_EVENTS.has(eventType)) {
      await service.recordSubscriptionStatusChange(subscription.id, subscription.status, {
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
