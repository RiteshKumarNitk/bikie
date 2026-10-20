import { billingRepository, partnerMembershipRepository, razorpayWebhookRepository, userRepository } from "@bikie/database";
import type { PartnerMembershipPlanDTO, PartnerMembershipDTO } from "@bikie/types";
import { isRealRazorpayPaymentId } from "./billing.internal";
import { maskPhone } from "./modules/communications/domain/phone";
import { isTestServiceProviderAccount } from "./modules/identity-access/domain/test-otp-bypass";
import { RazorpayService } from "./razorpay.service";
import { MSG91_SMS_TEMPLATE_ENV, SMSService } from "./sms.service";

/** ADR-069 — mirrors `MembershipService`'s `PurchaseMembershipResult`. */
export type PurchasePartnerMembershipResult =
  | { ok: true; membership: PartnerMembershipDTO }
  | { ok: false; reason: "ALREADY_ACTIVE" };

/** ADR-051 — mirrors `MembershipService`, entirely separate data. */
export const PartnerMembershipService = {
  async getPlans(): Promise<PartnerMembershipPlanDTO[]> {
    return partnerMembershipRepository.findAllActivePlans();
  },

  async getActiveMembership(userId: string): Promise<PartnerMembershipDTO | null> {
    return partnerMembershipRepository.getActiveMembership(userId);
  },

  async getPlanById(planId: string): Promise<PartnerMembershipPlanDTO | null> {
    return partnerMembershipRepository.findPlanById(planId);
  },

  /** ADR-089 — the allowlisted store-review/QA Service Provider test account
   * (`TEST_SERVICE_PROVIDER_PHONE`, only while the ADR-072 test bypass is enabled) activates paid
   * plans without a real payment. Never true for any other account. */
  isPaymentExemptTestAccount(phoneNumber: string | null | undefined): boolean {
    return isTestServiceProviderAccount(phoneNumber);
  },

  async purchaseMembership(
    userId: string,
    planId: string,
    paymentId?: string,
    razorpayOrderId?: string,
  ): Promise<PurchasePartnerMembershipResult> {
    // ADR-069 — idempotent replay (mirrors `MembershipService.purchaseMembership`).
    if (paymentId || razorpayOrderId) {
      const existing = await partnerMembershipRepository.findByPaymentReference({ paymentId, razorpayOrderId });
      if (existing) return { ok: true, membership: existing };
    }

    // ADR-069 — one active membership at a time (covers the free-tier path too: it calls this
    // with no payment reference, so a double "Activate" hits this check).
    const active = await partnerMembershipRepository.getActiveMembership(userId);
    if (active) return { ok: false, reason: "ALREADY_ACTIVE" };

    const membership = await partnerMembershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
    const user = await userRepository.findById(userId);

    // ADR-070 — persist the immutable receipt (snapshot from the row/plan just created;
    // idempotent per membership id + payment id). A free-tier activation (`amount` 0, no payment
    // reference) still gets an invoice so billing history is uniform across both account types.
    const invoice = await billingRepository.createInvoice({
      userId,
      accountType: "SERVICE_PROVIDER",
      partnerMembershipId: membership.id,
      planId: membership.plan.id,
      planName: membership.plan.name,
      amount: membership.plan.price,
      durationDays: membership.plan.durationDays,
      membershipStartDate: new Date(membership.startDate),
      membershipEndDate: new Date(membership.endDate),
      customerName: user?.name ?? "BIKIE Service Provider",
      customerPhone: user?.phoneNumber ?? null,
      paymentId: paymentId ?? null,
      razorpayPaymentId: isRealRazorpayPaymentId(paymentId) ? paymentId! : null,
      razorpayOrderId: razorpayOrderId ?? null,
      paidAt: new Date(),
    });

    // ADR-080/086 — Service Provider membership confirmation SMS: separate from the Rider
    // "BIKIE_Sub" template (annual-specific text, wrong for this monthly plan — see
    // `SMSService.sendPartnerMembershipSubscribed`'s doc comment). Mirrors the Rider flow exactly
    // otherwise: fire-and-forget, never fails/rolls back the purchase, deduped by the same
    // `confirmationSmsSentAt` guard. Refuses cleanly (logged, retryable) until the operator
    // registers a real SP DLT template and sets both its env vars — never sends the Rider
    // template just because a payment succeeded.
    const maskedPhone = maskPhone(user?.phoneNumber);
    const template = MSG91_SMS_TEMPLATE_ENV.PARTNER_MEMBERSHIP_SUBSCRIBED;
    if (!user?.phoneNumber) {
      console.log(
        `MEMBERSHIP_SMS_SKIPPED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER reason=NO_PHONE_ON_FILE`,
      );
    } else if (invoice.confirmationSmsSentAt) {
      console.log(
        `MEMBERSHIP_SMS_ALREADY_SENT userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER phone=${maskedPhone}`,
      );
    } else {
      console.log(
        `MEMBERSHIP_SMS_DISPATCH_START userId=${userId} invoiceId=${invoice.id} membershipId=${membership.id} ` +
          `accountType=SERVICE_PROVIDER phone=${maskedPhone} template=${template}`,
      );
      SMSService.sendPartnerMembershipSubscribed(user.phoneNumber, user.name, new Date(membership.endDate))
        .then((res) => {
          if (res && res.ok === false) {
            // "unconfigured" is already logged (at error level, naming the exact env var(s)) by
            // SMSService itself — logging it again here at error level would double the noise on
            // every single purchase until the operator registers the SP template. A genuine send
            // failure is a real error worth its own line.
            if (res.provider === "unconfigured") {
              console.log(
                `MEMBERSHIP_SMS_UNCONFIGURED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
                  `phone=${maskedPhone} template=${template}`,
              );
            } else {
              console.error(
                `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
                  `phone=${maskedPhone} template=${template} reason=${(res.error ?? "unknown").slice(0, 200)}`,
              );
            }
            return;
          }
          console.log(
            `MEMBERSHIP_SMS_GATEWAY_ACCEPTED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
              `phone=${maskedPhone} template=${template}${res?.detail ? ` msg91ReqId=${res.detail}` : ""}`,
          );
          return billingRepository.markConfirmationSmsSent(invoice.id);
        })
        .catch((err) =>
          console.error(
            `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=SERVICE_PROVIDER ` +
              `phone=${maskedPhone} template=${template} reason=${String(err).slice(0, 200)}`,
          ),
        );
    }

    return { ok: true, membership };
  },

  // --- Recurring Razorpay Subscriptions (additive) — `purchaseMembership` above is the
  // one-time/free/test-account path and is unchanged by any of what follows. ---

  /** `true` the first time this Razorpay webhook event id is seen; `false` (and logs it) on any
   * replay — the webhook route's ONLY idempotency gate, checked before any event is acted on. */
  async claimWebhookEvent(razorpayEventId: string, eventType: string): Promise<boolean> {
    const claimed = await razorpayWebhookRepository.tryClaimEvent(razorpayEventId, eventType);
    if (!claimed) {
      console.log(`SUBSCRIPTION_WEBHOOK_DUPLICATE razorpayEventId=${razorpayEventId} eventType=${eventType}`);
    }
    return claimed;
  },

  /**
   * Starts a ₹99/month Razorpay Subscription for the authenticated Service Provider. Creates the
   * Razorpay Subscription object and a placeholder `PartnerMembership` row (so the webhook has
   * something to find/update), but does NOT grant eligibility — `createSubscriptionMembership`
   * sets `endDate = startDate = now`, which already fails the existing
   * `endDate >= now()` check everywhere it's read. Eligibility begins only once a webhook-
   * confirmed charge calls `recordRecurringCharge`.
   */
  async startSubscription(userId: string, planId: string): Promise<StartSubscriptionResult> {
    const plan = await partnerMembershipRepository.findPlanById(planId);
    if (!plan || !plan.isActive) return { ok: false, reason: "PLAN_NOT_FOUND" };

    const activeOneTime = await partnerMembershipRepository.getActiveMembership(userId);
    if (activeOneTime) return { ok: false, reason: "ALREADY_ACTIVE" };

    const openSubscription = await partnerMembershipRepository.findOpenSubscriptionForUser(userId);
    if (openSubscription) return { ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" };

    const razorpayPlanId = process.env.RAZORPAY_SP_MEMBERSHIP_PLAN_ID?.trim();
    if (!razorpayPlanId) {
      console.error(
        "[Subscription][CONFIG] RAZORPAY_SP_MEMBERSHIP_PLAN_ID is not set — cannot start a subscription.",
      );
      return { ok: false, reason: "NOT_CONFIGURED" };
    }
    if (!RazorpayService.isConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };

    const subscription = await RazorpayService.createSubscription(razorpayPlanId, {
      userId,
      planId: plan.id,
      planName: plan.name,
      accountType: "SERVICE_PROVIDER",
    });
    if (!subscription) return { ok: false, reason: "SUBSCRIPTION_CREATE_FAILED" };

    const membership = await partnerMembershipRepository.createSubscriptionMembership(
      userId,
      planId,
      subscription.id,
      razorpayPlanId,
      subscription.status,
    );
    console.log(
      `SUBSCRIPTION_STARTED userId=${userId} membershipId=${membership.id} razorpaySubscriptionId=${subscription.id} status=${subscription.status}`,
    );
    return { ok: true, membership, subscription: { id: subscription.id, status: subscription.status, shortUrl: subscription.shortUrl } };
  },

  /**
   * Cancels the Service Provider's open subscription. `cancelAtCycleEnd: true` — Razorpay won't
   * attempt another charge, but the already-paid-for current period is never retroactively
   * invalidated: `status`/`endDate` are untouched here, so the existing eligibility check keeps
   * working exactly until `endDate` (== `currentPeriodEnd` from the last successful charge)
   * naturally passes.
   */
  async cancelSubscription(userId: string): Promise<CancelSubscriptionResult> {
    const membership = await partnerMembershipRepository.findOpenSubscriptionForUser(userId);
    if (!membership || !membership.razorpaySubscriptionId) return { ok: false, reason: "NO_ACTIVE_SUBSCRIPTION" };

    const result = await RazorpayService.cancelSubscription(membership.razorpaySubscriptionId, true);
    if (!result) return { ok: false, reason: "CANCEL_FAILED" };

    const updated = await partnerMembershipRepository.updateSubscriptionStatus(membership.id, result.status, {
      cancelledAt: new Date(),
    });
    console.log(
      `SUBSCRIPTION_CANCELLED userId=${userId} membershipId=${membership.id} razorpaySubscriptionId=${membership.razorpaySubscriptionId} ` +
        `status=${result.status} retainsAccessUntil=${updated.endDate}`,
    );
    return { ok: true, membership: updated };
  },

  /**
   * Webhook-driven (`subscription.activated` with a payment, or `subscription.charged`) —
   * records a successful recurring charge: extends `endDate`/`currentPeriodEnd`, stamps
   * `lastPaymentId`, and writes a NEW invoice (never modifying a prior one — every recurring
   * charge gets its own receipt, via `createRecurringPartnerInvoice`, which is idempotent on
   * `razorpayPaymentId` alone, never on the membership id). Returns `null` (logged) if no
   * `PartnerMembership` row has this subscription id — the caller (the webhook route) must still
   * ack the event so Razorpay doesn't retry forever; there's simply nothing more to do.
   */
  async recordRecurringCharge(
    razorpaySubscriptionId: string,
    data: {
      subscriptionStatus: string;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date;
      razorpayPaymentId: string;
      amount: number;
    },
  ): Promise<PartnerMembershipDTO | null> {
    const membership = await partnerMembershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) {
      console.error(`SUBSCRIPTION_CHARGE_UNKNOWN_SUBSCRIPTION razorpaySubscriptionId=${razorpaySubscriptionId}`);
      return null;
    }

    const updated = await partnerMembershipRepository.recordSubscriptionCharge(membership.id, {
      subscriptionStatus: data.subscriptionStatus,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      lastPaymentId: data.razorpayPaymentId,
    });

    const user = await userRepository.findById(membership.userId);
    await billingRepository.createRecurringPartnerInvoice({
      userId: membership.userId,
      accountType: "SERVICE_PROVIDER",
      partnerMembershipId: membership.id,
      planId: membership.planId,
      planName: membership.plan.name,
      amount: data.amount,
      durationDays: membership.plan.durationDays,
      membershipStartDate: data.currentPeriodStart ?? new Date(),
      membershipEndDate: data.currentPeriodEnd,
      customerName: user?.name ?? "BIKIE Service Provider",
      customerPhone: user?.phoneNumber ?? null,
      razorpayPaymentId: data.razorpayPaymentId,
      paidAt: new Date(),
    });

    console.log(
      `SUBSCRIPTION_CHARGED userId=${membership.userId} membershipId=${membership.id} ` +
        `razorpaySubscriptionId=${razorpaySubscriptionId} newEndDate=${updated.endDate} razorpayPaymentId=${data.razorpayPaymentId}`,
    );
    return updated;
  },

  /**
   * Status-only webhook events (`subscription.pending`/`subscription.halted`/
   * `subscription.completed`, and `subscription.cancelled` when Razorpay — not this app's own
   * `cancelSubscription` — initiates it): never touches `status`/`endDate`, exactly mirroring
   * `cancelSubscription` above.
   */
  async recordSubscriptionStatusChange(
    razorpaySubscriptionId: string,
    subscriptionStatus: string,
    opts: { cancelledAt?: Date } = {},
  ): Promise<PartnerMembershipDTO | null> {
    const membership = await partnerMembershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) return null;

    const updated = await partnerMembershipRepository.updateSubscriptionStatus(membership.id, subscriptionStatus, opts);
    console.log(
      `SUBSCRIPTION_STATUS_CHANGED userId=${membership.userId} membershipId=${membership.id} ` +
        `razorpaySubscriptionId=${razorpaySubscriptionId} subscriptionStatus=${subscriptionStatus}`,
    );
    return updated;
  },
};

export type StartSubscriptionResult =
  | { ok: true; membership: PartnerMembershipDTO; subscription: { id: string; status: string; shortUrl: string } }
  | { ok: false; reason: "PLAN_NOT_FOUND" | "ALREADY_ACTIVE" | "SUBSCRIPTION_ALREADY_EXISTS" | "NOT_CONFIGURED" | "SUBSCRIPTION_CREATE_FAILED" };

export type CancelSubscriptionResult =
  | { ok: true; membership: PartnerMembershipDTO }
  | { ok: false; reason: "NO_ACTIVE_SUBSCRIPTION" | "CANCEL_FAILED" };
