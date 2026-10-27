import type { AdminTransactionDTO } from "@bikie/types";

/**
 * Pure display logic for the admin Transactions drawer/list's "Auto-Renewal" / subscription
 * section — the admin-facing counterpart to `subscription-display.ts` (the Rider's/Service
 * Provider's own view of their own subscription). Deliberately a separate module, not a reuse of
 * that one: the admin needs more raw detail (the literal Razorpay status word, how many renewals
 * have happened, a cancellation date) that the member-facing copy intentionally simplifies away.
 * Works for either account type already — every date/amount here is read straight off
 * `AdminTransactionDTO` (ultimately `UserMembership`/`PartnerMembership` + the invoice's own
 * snapshot columns, generalized across both in `billing.repository.ts`) — nothing is computed or
 * guessed in this module.
 */

const HEALTHY_SUBSCRIPTION_STATUSES = new Set(["created", "authenticated", "active"]);

/** "Monthly" for the real ₹99/30-day plan; falls back to the raw day count for anything else. */
export function renewalPeriodLabel(durationDays: number): string {
  if (durationDays === 30) return "Monthly";
  if (durationDays === 365) return "Yearly";
  return `Every ${durationDays} days`;
}

function statusLabel(status: string | null): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export type AdminSubscriptionDisplayState =
  | { kind: "none" }
  | {
      kind: "active";
      statusLabel: string;
      nextDebitDate: string;
      nextDebitAmount: number;
      renewsOnDate: string;
      paidThroughDate: string;
      renewalCount: number;
      renewalPeriodLabel: string;
    }
  | {
      kind: "payment_problem";
      statusLabel: string;
      paidThroughDate: string;
      renewalCount: number;
    }
  | {
      kind: "cancelled";
      statusLabel: string;
      paidThroughDate: string;
      cancelledAtDate: string | null;
      renewalCount: number;
    };

type SubscriptionTx = Pick<AdminTransactionDTO, "amount" | "membershipEndDate" | "subscription" | "durationDays">;

/**
 * Decides what the admin "Auto-Renewal" section should show, in priority order: a scheduled
 * cancellation always wins over a lingering payment-problem status (Razorpay stamps both
 * together on a Razorpay-initiated cancellation) — "cancelled" is the more accurate framing.
 * Returns `{ kind: "none" }` for a `ONE_TIME` transaction (`tx.subscription` is `null`), where
 * there's nothing recurring to show at all.
 */
export function adminSubscriptionDisplayState(tx: SubscriptionTx): AdminSubscriptionDisplayState {
  const sub = tx.subscription;
  if (!sub) return { kind: "none" };

  const paidThroughDate = tx.membershipEndDate;

  if (sub.cancelledAt) {
    return {
      kind: "cancelled",
      statusLabel: statusLabel(sub.status),
      paidThroughDate,
      cancelledAtDate: sub.cancelledAt,
      renewalCount: sub.renewalCount,
    };
  }

  if (sub.status && !HEALTHY_SUBSCRIPTION_STATUSES.has(sub.status)) {
    return {
      kind: "payment_problem",
      statusLabel: statusLabel(sub.status),
      paidThroughDate,
      renewalCount: sub.renewalCount,
    };
  }

  // A healthy, active subscription always has a currentPeriodEnd by the time it's ACTIVE (set
  // the moment the first charge lands) — but fall back to the membership's own paid-through date
  // defensively rather than rendering a blank "next debit" if it's ever missing.
  const nextDebitIso = sub.currentPeriodEnd ?? tx.membershipEndDate;
  return {
    kind: "active",
    statusLabel: statusLabel(sub.status),
    nextDebitDate: nextDebitIso,
    nextDebitAmount: tx.amount,
    renewsOnDate: nextDebitIso,
    paidThroughDate,
    renewalCount: sub.renewalCount,
    renewalPeriodLabel: renewalPeriodLabel(tx.durationDays),
  };
}
