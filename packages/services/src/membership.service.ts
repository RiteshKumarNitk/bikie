import { billingRepository, membershipRepository, userRepository } from "@bikie/database";
import type { MembershipPlanDTO, UserMembershipDTO, AdminUserSubscriptionDTO } from "@bikie/types";
import { maskPhone } from "./modules/communications/domain/phone";
import { isTestRiderAccount } from "./modules/identity-access/domain/test-otp-bypass";
import { MSG91_SMS_TEMPLATE_ENV, SMSService } from "./sms.service";
import { isRealRazorpayPaymentId } from "./billing.internal";
import { RazorpayService } from "./razorpay.service";

/** ADR-069 — discriminated result (mirrors `BookingService.create`'s shape): `ALREADY_ACTIVE`
 * is a business-rule rejection the route maps to `409`, not an exception. A replayed payment
 * for a membership that already exists still resolves `{ ok: true }` with that same row. */
export type PurchaseMembershipResult =
  | { ok: true; membership: UserMembershipDTO }
  | { ok: false; reason: "ALREADY_ACTIVE" };

/** How long a just-created, never-charged subscription is protected from the stale-retry
 * cancel-and-replace logic in `startSubscription` — longer than Razorpay's own typical UPI
 * AutoPay authorization window (its `payment_timed_out` failures have been observed taking a
 * couple of minutes to surface), so a genuinely in-flight mandate is never cancelled out from
 * under the Rider by their own retry. */
const SUBSCRIPTION_RETRY_GRACE_PERIOD_MS = 5 * 60 * 1000;

export const MembershipService = {
  async getPlans(): Promise<MembershipPlanDTO[]> {
    return membershipRepository.findAllActivePlans();
  },

  async getActiveMembership(userId: string): Promise<UserMembershipDTO | null> {
    return membershipRepository.getActiveMembership(userId);
  },

  /** A subscription that's been created (Rider is mid-Razorpay-authorization, or finished it but
   * the webhook hasn't landed yet) but was never webhook-confirmed charged — distinct from
   * `getActiveMembership`, which only ever returns a genuinely paid/active row (its `endDate >=
   * now()` check excludes this placeholder entirely, by design). Lets the UI show "payment
   * pending" honestly instead of silently looking exactly like no purchase was ever attempted.
   * `null` whenever there's nothing open — no attempt at all, or a genuinely active one
   * (`getActiveMembership`'s job), or a terminal one (cancelled/completed/expired, excluded by
   * `findOpenSubscriptionForUser` itself). Never returns anything already reflected as `active`
   * — a caller should only check this when `getActiveMembership` returned `null`. */
  async getPendingSubscription(userId: string): Promise<UserMembershipDTO | null> {
    return membershipRepository.findOpenSubscriptionForUser(userId);
  },

  async getPlanById(planId: string): Promise<MembershipPlanDTO | null> {
    return membershipRepository.findPlanById(planId);
  },

  /** ADR-089-equivalent for Riders — mirrors `PartnerMembershipService.isPaymentExemptTestAccount`
   * exactly. The allowlisted store-review/QA Rider test account (`TEST_RIDER_PHONE`, only while
   * the ADR-072 test bypass is enabled) activates a paid plan without a real payment — it can't
   * complete a real Razorpay Subscription mandate authorization during app-store review. Never
   * true for any other account. */
  isPaymentExemptTestAccount(phoneNumber: string | null | undefined): boolean {
    return isTestRiderAccount(phoneNumber);
  },

  /** ADR-058 — the "BIKIE_Sub" DLT SMS confirmation is a best-effort side effect fired after the
   * membership row is created, mirroring `AccountTypeRequestService.review`'s established pattern
   * for this repo: a notification failure must never fail an otherwise-successful purchase, so
   * it's fire-and-forget with its own `.catch`, never awaited into the response. Rider-only —
   * see `SMSService.sendMembershipSubscribed`'s doc comment for why this must never fire for a
   * Service Provider membership purchase (`PartnerMembershipService`, a separate module/table). */
  async purchaseMembership(
    userId: string,
    planId: string,
    paymentId?: string,
    razorpayOrderId?: string,
  ): Promise<PurchaseMembershipResult> {
    // ADR-069 — idempotent replay: this exact payment reference already activated a membership
    // (a re-fired Razorpay callback, a double-submit). Return that row, don't mint another and
    // don't re-fire the confirmation SMS.
    if (paymentId || razorpayOrderId) {
      const existing = await membershipRepository.findByPaymentReference({ paymentId, razorpayOrderId });
      if (existing) return { ok: true, membership: existing };
    }

    // ADR-069 — one active membership at a time. A *new* payment while already covered is a
    // client bug or a stale UI; reject it rather than stacking a second membership (there is no
    // renewal/upgrade flow yet — see ROADMAP Milestone 4).
    const active = await membershipRepository.getActiveMembership(userId);
    if (active) return { ok: false, reason: "ALREADY_ACTIVE" };

    const membership = await membershipRepository.createMembership(userId, planId, paymentId, razorpayOrderId);
    const user = await userRepository.findById(userId);

    // ADR-070 — persist the immutable receipt. Every figure is snapshot from the row/plan we
    // just created; `createInvoice` is itself idempotent (unique on the membership id + payment
    // id), so a retry that gets past the guards above still yields exactly one invoice.
    const invoice = await billingRepository.createInvoice({
      userId,
      accountType: "RIDER",
      userMembershipId: membership.id,
      planId: membership.plan.id,
      planName: membership.plan.name,
      amount: membership.plan.price,
      durationDays: membership.plan.durationDays,
      membershipStartDate: new Date(membership.startDate),
      membershipEndDate: new Date(membership.endDate),
      customerName: user?.name ?? "BIKIE Member",
      customerPhone: user?.phoneNumber ?? null,
      paymentId: paymentId ?? null,
      razorpayPaymentId: isRealRazorpayPaymentId(paymentId) ? paymentId! : null,
      razorpayOrderId: razorpayOrderId ?? null,
      paidAt: new Date(),
    });

    // ADR-058/070/086 — the "BIKIE_Sub" DLT confirmation SMS: fired only here (after activation
    // AND the invoice), Rider-only, exactly once per activated membership. Fire-and-forget — a
    // delivery failure must never fail or roll back the purchase; `confirmationSmsSentAt` is
    // only stamped on a non-failing send, leaving a failed one visible for a later retry.
    const maskedPhone = maskPhone(user?.phoneNumber);
    if (!user?.phoneNumber) {
      console.log(
        `MEMBERSHIP_SMS_SKIPPED userId=${userId} invoiceId=${invoice.id} accountType=RIDER reason=NO_PHONE_ON_FILE`,
      );
    } else if (invoice.confirmationSmsSentAt) {
      console.log(
        `MEMBERSHIP_SMS_ALREADY_SENT userId=${userId} invoiceId=${invoice.id} accountType=RIDER phone=${maskedPhone}`,
      );
    } else {
      console.log(
        `MEMBERSHIP_SMS_DISPATCH_START userId=${userId} invoiceId=${invoice.id} membershipId=${membership.id} ` +
          `accountType=RIDER phone=${maskedPhone} template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED}`,
      );
      SMSService.sendMembershipSubscribed(user.phoneNumber, user.name, new Date(membership.endDate))
        .then((res) => {
          if (res && res.ok === false) {
            // "unconfigured" is already logged (at error level, naming the exact env var) by
            // `resolveSmsTemplateId` inside SMSService itself — logging it again here at error
            // level would double the noise on every single purchase until the operator sets the
            // template id. A genuine send failure (MSG91 rejected it, network error, etc.) is a
            // real error worth its own line.
            if (res.provider === "unconfigured") {
              console.log(
                `MEMBERSHIP_SMS_UNCONFIGURED userId=${userId} invoiceId=${invoice.id} accountType=RIDER ` +
                  `phone=${maskedPhone} template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED}`,
              );
            } else {
              console.error(
                `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=RIDER phone=${maskedPhone} ` +
                  `template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED} reason=${(res.error ?? "unknown").slice(0, 200)}`,
              );
            }
            return;
          }
          // Gateway acceptance (see the SMS adapter's note) — `detail` is MSG91's request id for
          // a dashboard/DLR trace. Stamp `confirmationSmsSentAt` so it is never re-sent.
          console.log(
            `MEMBERSHIP_SMS_GATEWAY_ACCEPTED userId=${userId} invoiceId=${invoice.id} accountType=RIDER ` +
              `phone=${maskedPhone} template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED}` +
              `${res?.detail ? ` msg91ReqId=${res.detail}` : ""}`,
          );
          return billingRepository.markConfirmationSmsSent(invoice.id);
        })
        .catch((err) =>
          console.error(
            `MEMBERSHIP_SMS_FAILED userId=${userId} invoiceId=${invoice.id} accountType=RIDER phone=${maskedPhone} ` +
              `template=${MSG91_SMS_TEMPLATE_ENV.MEMBERSHIP_SUBSCRIBED} reason=${String(err).slice(0, 200)}`,
          ),
        );
    }

    return { ok: true, membership };
  },

  // --- Recurring Razorpay Subscriptions (additive) — `purchaseMembership` above is the
  // one-time/free path and is unchanged by any of what follows. Mirrors
  // `PartnerMembershipService`'s identical section exactly (Service Provider ₹99/month), for
  // Rider ₹149/year instead — same code shape, entirely separate rows/table/env var. ---

  /**
   * Starts a ₹149/year Razorpay Subscription for the authenticated Rider. Creates the Razorpay
   * Subscription object and a placeholder `UserMembership` row (so the webhook has something to
   * find/update), but does NOT grant eligibility — `createSubscriptionMembership` sets
   * `endDate = startDate = now`, which already fails the existing `endDate >= now()` check
   * everywhere it's read. Eligibility begins only once a webhook-confirmed charge calls
   * `recordRecurringCharge`.
   */
  async startSubscription(userId: string, planId: string): Promise<StartMembershipSubscriptionResult> {
    const plan = await membershipRepository.findPlanById(planId);
    if (!plan || !plan.isActive) return { ok: false, reason: "PLAN_NOT_FOUND" };

    const activeOneTime = await membershipRepository.getActiveMembership(userId);
    if (activeOneTime) return { ok: false, reason: "ALREADY_ACTIVE" };

    const openSubscription = await membershipRepository.findOpenSubscriptionForUser(userId);
    if (openSubscription) {
      // A locally-stored "open" subscription might just be a stale/abandoned authorization
      // attempt (the Rider's mandate was rejected by their bank/UPI app, or they backed out) —
      // that should never permanently block a retry, since no money ever moved. But deciding
      // that from our OWN row alone is unsafe: a webhook can still be in flight when the Rider
      // retries, so a locally-stale "created" status doesn't prove Razorpay agrees nothing was
      // ever charged. Always ask Razorpay directly (`fetchSubscription` — its live `status` +
      // `paid_count`, never inferred) before touching anything.
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
        // even if our local row hasn't caught up yet. Never silently replace this; the Rider must
        // cancel it explicitly (the existing Cancel Auto-Renewal flow) before starting another.
        return { ok: false, reason: "SUBSCRIPTION_ALREADY_EXISTS" };
      }

      // A row created only moments ago is NOT yet "abandoned" even if its own state is
      // created/non-terminal — the Rider may be mid-authorization RIGHT NOW (UPI app, bank 2FA,
      // Razorpay's own "processing your payment" step can genuinely take a couple of minutes).
      // Without this, a Rider who returns to the membership screen and taps the button again
      // while their first attempt is still in flight would have this code silently cancel that
      // in-flight mandate out from under them (real, observed failure mode — the retry logic
      // treating "created 10 seconds ago" the same as "abandoned 3 days ago"). Only a row older
      // than this grace period is eligible to be replaced; a too-recent one blocks instead, with
      // a message telling the Rider to wait rather than another generic "already exists."
      const ageMs = Date.now() - new Date(openSubscription.startDate).getTime();
      if (ageMs < SUBSCRIPTION_RETRY_GRACE_PERIOD_MS) {
        return { ok: false, reason: "SUBSCRIPTION_AUTHORIZATION_IN_PROGRESS" };
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

    const razorpayPlanId = process.env.RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID?.trim();
    if (!razorpayPlanId) {
      console.error(
        "[Subscription][CONFIG] RAZORPAY_RIDER_MEMBERSHIP_PLAN_ID is not set — cannot start a subscription.",
      );
      return { ok: false, reason: "NOT_CONFIGURED" };
    }
    if (!RazorpayService.isConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };

    // Rider membership is yearly, not monthly — Razorpay caps `total_count` per billing
    // period/interval combination, so the monthly default (1200, "100 years of months") is
    // invalid here and gets rejected outright (`BAD_REQUEST_ERROR "Exceeds the maximum
    // total_count (100) allowed for the given period and interval"`). See
    // `SUBSCRIPTION_TOTAL_COUNT_YEARLY`'s own doc comment in razorpay.service.ts — 20, not
    // Razorpay's API-level cap of 100, per Razorpay Support's confirmed 25-year UPI AutoPay limit.
    const subscription = await RazorpayService.createSubscription(
      razorpayPlanId,
      {
        userId,
        planId: plan.id,
        planName: plan.name,
        accountType: "RIDER",
      },
      RazorpayService.SUBSCRIPTION_TOTAL_COUNT_YEARLY,
    );
    if (!subscription) return { ok: false, reason: "SUBSCRIPTION_CREATE_FAILED" };

    const membership = await membershipRepository.createSubscriptionMembership(
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
   * Cancels the Rider's open subscription. `cancelAtCycleEnd: true` — Razorpay won't attempt
   * another charge, but the already-paid-for current period is never retroactively invalidated:
   * `status`/`endDate` are untouched here, so the existing eligibility check keeps working
   * exactly until `endDate` (== `currentPeriodEnd` from the last successful charge) naturally
   * passes.
   */
  async cancelSubscription(userId: string): Promise<CancelMembershipSubscriptionResult> {
    const membership = await membershipRepository.findOpenSubscriptionForUser(userId);
    if (!membership || !membership.razorpaySubscriptionId) return { ok: false, reason: "NO_ACTIVE_SUBSCRIPTION" };

    const result = await RazorpayService.cancelSubscription(membership.razorpaySubscriptionId, true);
    if (!result) return { ok: false, reason: "CANCEL_FAILED" };

    const updated = await membershipRepository.updateSubscriptionStatus(membership.id, result.status, {
      cancelledAt: new Date(),
    });
    console.log(
      `SUBSCRIPTION_CANCELLED userId=${userId} membershipId=${membership.id} razorpaySubscriptionId=${membership.razorpaySubscriptionId} ` +
        `status=${result.status} retainsAccessUntil=${updated.endDate}`,
    );
    return { ok: true, membership: updated };
  },

  /** Admin-only "who's subscribed" view — see `membershipRepository.listAllSubscriptions`'s own
   * doc comment for why this is sourced from `UserMembership` rows directly rather than
   * invoices/transactions. */
  async listAllSubscriptions(): Promise<AdminUserSubscriptionDTO[]> {
    return membershipRepository.listAllSubscriptions();
  },

  /**
   * Admin-triggered cancellation of ANY Rider's subscription, identified by its Razorpay
   * Subscription id (not scoped to the calling user — `cancelSubscription` above is the
   * self-service version for that). Same `cancelAtCycleEnd: true` behavior: Razorpay won't
   * attempt another charge, but the already-paid-for current period is never retroactively
   * revoked.
   */
  async adminCancelSubscription(razorpaySubscriptionId: string): Promise<AdminCancelMembershipSubscriptionResult> {
    const membership = await membershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) return { ok: false, reason: "NOT_FOUND" };

    const result = await RazorpayService.cancelSubscription(razorpaySubscriptionId, true);
    if (!result) return { ok: false, reason: "CANCEL_FAILED" };

    const updated = await membershipRepository.updateSubscriptionStatus(membership.id, result.status, {
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
   * `UserMembership` row has this subscription id — the caller (the webhook route) must still
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
  ): Promise<UserMembershipDTO | null> {
    const membership = await membershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) {
      console.error(`SUBSCRIPTION_CHARGE_UNKNOWN_SUBSCRIPTION razorpaySubscriptionId=${razorpaySubscriptionId}`);
      return null;
    }

    const updated = await membershipRepository.recordSubscriptionCharge(membership.id, {
      subscriptionStatus: data.subscriptionStatus,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      lastPaymentId: data.razorpayPaymentId,
    });

    const user = await userRepository.findById(membership.userId);
    await billingRepository.createRecurringInvoice({
      userId: membership.userId,
      accountType: "RIDER",
      userMembershipId: membership.id,
      planId: membership.planId,
      planName: membership.plan.name,
      amount: data.amount,
      durationDays: membership.plan.durationDays,
      membershipStartDate: data.currentPeriodStart ?? new Date(),
      membershipEndDate: data.currentPeriodEnd,
      customerName: user?.name ?? "BIKIE Member",
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
  ): Promise<UserMembershipDTO | null> {
    const membership = await membershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) return null;

    const updated = await membershipRepository.updateSubscriptionStatus(membership.id, subscriptionStatus, opts);
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
  async reconcileSubscription(razorpaySubscriptionId: string): Promise<ReconcileMembershipSubscriptionResult> {
    const membership = await membershipRepository.findByRazorpaySubscriptionId(razorpaySubscriptionId);
    if (!membership) return { ok: false, reason: "NOT_FOUND" };

    const live = await RazorpayService.fetchSubscription(razorpaySubscriptionId);
    if (!live) return { ok: false, reason: "COULD_NOT_VERIFY" };

    const paidInvoices = await RazorpayService.listSubscriptionInvoices(razorpaySubscriptionId);

    let updated: UserMembershipDTO | null = null;
    for (const invoice of paidInvoices) {
      updated = await MembershipService.recordRecurringCharge(razorpaySubscriptionId, {
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
      updated = await membershipRepository.updateSubscriptionStatus(membership.id, live.status, {});
    }

    console.log(
      `SUBSCRIPTION_RECONCILED userId=${membership.userId} membershipId=${membership.id} ` +
        `razorpaySubscriptionId=${razorpaySubscriptionId} invoicesFound=${paidInvoices.length} liveStatus=${live.status}`,
    );
    return { ok: true, membership: updated, invoicesFound: paidInvoices.length };
  },
};

export type StartMembershipSubscriptionResult =
  | { ok: true; membership: UserMembershipDTO; subscription: { id: string; status: string; shortUrl: string } }
  | {
      ok: false;
      reason:
        | "PLAN_NOT_FOUND"
        | "ALREADY_ACTIVE"
        | "SUBSCRIPTION_ALREADY_EXISTS"
        | "SUBSCRIPTION_AUTHORIZATION_IN_PROGRESS"
        | "NOT_CONFIGURED"
        | "SUBSCRIPTION_CREATE_FAILED";
    };

export type CancelMembershipSubscriptionResult =
  | { ok: true; membership: UserMembershipDTO }
  | { ok: false; reason: "NO_ACTIVE_SUBSCRIPTION" | "CANCEL_FAILED" };

export type ReconcileMembershipSubscriptionResult =
  | { ok: true; membership: UserMembershipDTO; invoicesFound: number }
  | { ok: false; reason: "NOT_FOUND" | "COULD_NOT_VERIFY" };

export type AdminCancelMembershipSubscriptionResult =
  | { ok: true; membership: UserMembershipDTO }
  | { ok: false; reason: "NOT_FOUND" | "CANCEL_FAILED" };