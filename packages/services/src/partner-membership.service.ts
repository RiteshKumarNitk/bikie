import { billingRepository, partnerMembershipRepository, razorpayWebhookRepository, userRepository } from "@bikie/database";
import type { PartnerMembershipPlanDTO, PartnerMembershipDTO, AdminPartnerSubscriptionDTO } from "@bikie/types";
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
    if (openSubscription) {
      // A locally-stored "open" subscription might just be a stale/abandoned authorization
      // attempt (the SP's mandate was rejected by their bank/UPI app, or they backed out) — that
      // should never permanently block a retry, since no money ever moved. But deciding that from
      // our OWN row alone is unsafe: a webhook can still be in flight when the SP retries, so a
      // locally-stale "created" status doesn't prove Razorpay agrees nothing was ever charged.
      // Always ask Razorpay directly (`fetchSubscription` — its live `status` + `paid_count`,
      // never inferred) before touching anything.
      if (!openSubscription.razorpaySubscriptionId) {
        // Shouldn't happen (`findOpenSubscriptionForUser` only ever matches rows with this set),
        // but nothing to verify against if it ever does — fail toward safety, not toward guessing.
        return { ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" };
      }

      const live = await RazorpayService.fetchSubscription(openSubscription.razorpaySubscriptionId);
      if (!live) {
        // Could not verify Razorpay's own state (network/API error) — fail toward safety. Never
        // silently cancel a subscription whose real status we couldn't confirm.
        console.error(
          `SUBSCRIPTION_RETRY_VERIFY_FAILED userId=${userId} razorpaySubscriptionId=${openSubscription.razorpaySubscriptionId}`,
        );
        return { ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" };
      }

      if (live.paidCount > 0) {
        // Razorpay's own record of at least one successful charge — a real, paying subscription,
        // even if our local row hasn't caught up yet. Never silently replace this; the SP must
        // cancel it explicitly (the existing Cancel Auto-Renewal flow) before starting another.
        return { ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" };
      }

      const TERMINAL_SUBSCRIPTION_STATUSES = new Set(["cancelled", "completed", "expired"]);
      if (!TERMINAL_SUBSCRIPTION_STATUSES.has(live.status)) {
        // Never charged (`paidCount === 0`) and not yet terminal on Razorpay's side either — a
        // genuinely stale, abandoned authorization attempt. Cancel it (best-effort — an orphaned,
        // unauthorized subscription never charges anything even if this call itself fails) before
        // starting a fresh one. If it's already terminal on Razorpay's side, there's nothing left
        // to cancel — fall straight through.
        const cancelled = await RazorpayService.cancelSubscription(openSubscription.razorpaySubscriptionId, false);
        console.log(
          `SUBSCRIPTION_STALE_RETRY userId=${userId} previousMembershipId=${openSubscription.id} ` +
            `previousRazorpaySubscriptionId=${openSubscription.razorpaySubscriptionId} liveStatus=${live.status} ` +
            `cancelResult=${cancelled ? cancelled.status : "CANCEL_CALL_FAILED"}`,
        );
      }
    }

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

  /** Admin-only "who's subscribed" view — see `partnerMembershipRepository.listAllSubscriptions`'s
   * own doc comment for why this is sourced from `PartnerMembership` rows directly rather than
   * invoices/transactions. */
  async listAllSubscriptions(): Promise<AdminPartnerSubscriptionDTO[]> {
    return partnerMembershipRepository.listAllSubscriptions();
  },

  /**
   * Admin-triggered cancellation of ANY Service Provider's subscription, identified by its
   * Razorpay Subscription id (not scoped to the calling user — `cancelSubscription` above is the
   * self-service version for that). Same `cancelAtCycleEnd: true` behavior: Razorpay won't
   * attempt another charge, but the already-paid-for current period is never retroactively
   * revoked. Used for cases the Service Provider can't or won't cancel themselves (support
   * request, fraud, a subscription stuck in `created` with no owner-visible way to cancel it from
   * the app, …).
   */
  async adminCancelSubscription(razorpaySubscriptionId: string): Promise<AdminCancelSubscriptionResult> {
    const membership = await partnerMembershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) return { ok: false, reason: "NOT_FOUND" };

    const result = await RazorpayService.cancelSubscription(razorpaySubscriptionId, true);
    if (!result) return { ok: false, reason: "CANCEL_FAILED" };

    const updated = await partnerMembershipRepository.updateSubscriptionStatus(membership.id, result.status, {
      cancelledAt: new Date(),
    });
    console.log(
      `SUBSCRIPTION_CANCELLED_BY_ADMIN userId=${membership.userId} membershipId=${membership.id} ` +
        `razorpaySubscriptionId=${razorpaySubscriptionId} status=${result.status} retainsAccessUntil=${updated.endDate}`,
    );
    return { ok: true, membership: updated };
  },

  /**
   * Webhook-driven (`subscription.activated` with a payment, or `subscription.charged`) —
   * records a successful recurring charge: extends `endDate`/`currentPeriodEnd`, stamps
   * `lastPaymentId`, and writes a NEW invoice (never modifying a prior one — every recurring
   * charge gets its own receipt, via `createRecurringInvoice`, which is idempotent on
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
      /** The real time Razorpay recorded this charge — reconciliation (`reconcileSubscription`,
       * replaying Razorpay's own invoice history) knows this exactly; the live webhook path
       * doesn't carry it in the payload this code currently parses, so it keeps defaulting to
       * "now" (the moment this function runs, same as before this param existed) unless passed. */
      paidAt?: Date;
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
    await billingRepository.createRecurringInvoice({
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
      paidAt: data.paidAt ?? new Date(),
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

  /**
   * Admin-triggered safety net for when Razorpay's webhook never reaches us — never delivered,
   * delivered while the app was down, rejected by a transient signature/env mismatch, or any
   * other reason a webhook (an unreliable, best-effort delivery by design) can simply not arrive.
   * Razorpay still has the truth even when we don't: this replays every PAID invoice it has
   * recorded against the subscription (oldest first — billing order matters, each extension
   * logically follows the previous one) through the EXACT SAME `recordRecurringCharge` path the
   * webhook itself uses, which is already idempotent on `razorpayPaymentId` — so running this on
   * a subscription that's already fully up to date is always a safe no-op, never a double-charge
   * or a duplicate invoice, and running it twice is equally safe. Also brings the locally-stored
   * `subscriptionStatus` in line with Razorpay's live status even when there's nothing to charge
   * (e.g. the subscription was cancelled on Razorpay's side and THAT webhook also never arrived).
   */
  async reconcileSubscription(razorpaySubscriptionId: string): Promise<ReconcileSubscriptionResult> {
    const membership = await partnerMembershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) return { ok: false, reason: "NOT_FOUND" };

    const live = await RazorpayService.fetchSubscription(razorpaySubscriptionId);
    if (!live) return { ok: false, reason: "COULD_NOT_VERIFY" };

    const paidInvoices = await RazorpayService.listSubscriptionInvoices(razorpaySubscriptionId);

    let updated: PartnerMembershipDTO | null = null;
    for (const invoice of paidInvoices) {
      updated = await PartnerMembershipService.recordRecurringCharge(razorpaySubscriptionId, {
        subscriptionStatus: live.status,
        currentPeriodStart: invoice.billingStart,
        currentPeriodEnd: invoice.billingEnd ?? invoice.paidAt,
        razorpayPaymentId: invoice.razorpayPaymentId,
        amount: invoice.amount,
        paidAt: invoice.paidAt,
      });
    }

    // No paid invoices found at all — nothing to charge-reconcile, but the subscription's status
    // may still have drifted locally (e.g. cancelled on Razorpay's side with that webhook ALSO
    // never delivered) — bring status in sync regardless.
    if (!updated) {
      updated = await partnerMembershipRepository.updateSubscriptionStatus(membership.id, live.status, {});
    }

    console.log(
      `SUBSCRIPTION_RECONCILED userId=${membership.userId} membershipId=${membership.id} ` +
        `razorpaySubscriptionId=${razorpaySubscriptionId} invoicesFound=${paidInvoices.length} liveStatus=${live.status}`,
    );
    return { ok: true, membership: updated, invoicesFound: paidInvoices.length };
  },
};

export type StartSubscriptionResult =
  | { ok: true; membership: PartnerMembershipDTO; subscription: { id: string; status: string; shortUrl: string } }
  | { ok: false; reason: "PLAN_NOT_FOUND" | "ALREADY_ACTIVE" | "SUBSCRIPTION_ALREADY_EXISTS" | "NOT_CONFIGURED" | "SUBSCRIPTION_CREATE_FAILED" };

export type CancelSubscriptionResult =
  | { ok: true; membership: PartnerMembershipDTO }
  | { ok: false; reason: "NO_ACTIVE_SUBSCRIPTION" | "CANCEL_FAILED" };

export type ReconcileSubscriptionResult =
  | { ok: true; membership: PartnerMembershipDTO; invoicesFound: number }
  | { ok: false; reason: "NOT_FOUND" | "COULD_NOT_VERIFY" };

export type AdminCancelSubscriptionResult =
  | { ok: true; membership: PartnerMembershipDTO }
  | { ok: false; reason: "NOT_FOUND" | "CANCEL_FAILED" };
