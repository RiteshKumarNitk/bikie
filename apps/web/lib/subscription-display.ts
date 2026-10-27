/**
 * Pure display logic for a recurring Razorpay Subscription — shared by BOTH the Rider (₹149/year,
 * `UserMembership`) and Service Provider (₹99/month, `PartnerMembership`) membership pages, since
 * the subscription fields are identically shaped on both DTOs and the date/status decisions don't
 * depend on which one it is. Kept separate from either `page.tsx`'s JSX specifically so the
 * decisions are unit-testable without a component-rendering setup (this app has none — no
 * `@testing-library/react`, no `.test.tsx` anywhere — matching its existing convention of
 * factoring display/branching logic into plain functions rather than adding new test
 * infrastructure for these pages).
 *
 * Every date shown here comes straight from the server's membership row
 * (`currentPeriodStart`/`currentPeriodEnd`/`endDate`, all ultimately written by
 * `recordSubscriptionCharge` from Razorpay's own webhook payload) — never computed/guessed on
 * the client.
 */

/** Subset of `UserMembershipDTO`/`PartnerMembershipDTO` this module actually needs — kept narrow
 * so either page's own `ActiveMembership` interface (unchanged) satisfies it structurally. */
export interface SubscriptionFields {
  endDate: string;
  razorpaySubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
}

/** Razorpay subscription statuses that mean "renewing normally" — anything else (`pending`,
 * `halted`, or an unrecognized future status) is surfaced as a payment problem. Mirrors the
 * backend's own `OPEN_SUBSCRIPTION_STATUSES`/webhook handling vocabulary. */
const HEALTHY_SUBSCRIPTION_STATUSES = new Set(["created", "authenticated", "active"]);

export type SubscriptionDisplayState =
  | { kind: "none" }
  | {
      kind: "active";
      nextPaymentDate: string;
      validUntilDate: string;
      renewalDate: string;
      periodStartDate: string | null;
    }
  | { kind: "payment_problem"; statusLabel: string; validUntilDate: string }
  | { kind: "cancelled"; validUntilDate: string };

/** `DD Month YYYY`, e.g. "15 November 2026" — the exact format the task's copy examples use. */
export function formatMembershipDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function statusLabel(status: string | null | undefined): string {
  if (status === "halted") return "Failed";
  if (status === "pending") return "Pending";
  if (!status) return "Failed";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Decides what the subscription section should show, in priority order: a cancellation already
 * scheduled (`cancelledAt`) always wins over a payment-problem status, since Razorpay stamps both
 * `subscriptionStatus: "cancelled"` and `cancelledAt` together and "scheduled for cancellation"
 * is the more accurate framing than "payment failed". Returns `{ kind: "none" }` for a one-time/
 * free membership (`razorpaySubscriptionId` absent) — `page.tsx` keeps its existing plain
 * "X days left" copy for that case, unchanged.
 */
export function subscriptionDisplayState(membership: SubscriptionFields): SubscriptionDisplayState {
  if (!membership.razorpaySubscriptionId) return { kind: "none" };

  if (membership.cancelledAt) {
    return { kind: "cancelled", validUntilDate: formatMembershipDate(membership.endDate) };
  }

  if (membership.subscriptionStatus && !HEALTHY_SUBSCRIPTION_STATUSES.has(membership.subscriptionStatus)) {
    return {
      kind: "payment_problem",
      statusLabel: statusLabel(membership.subscriptionStatus),
      validUntilDate: formatMembershipDate(membership.endDate),
    };
  }

  // `currentPeriodEnd` should always be set for a healthy, charged subscription (it's what makes
  // `endDate` match it in the first place — see `recordSubscriptionCharge`), but fall back to
  // `endDate` defensively rather than rendering a blank date if it's ever missing.
  const nextPaymentIso = membership.currentPeriodEnd ?? membership.endDate;
  return {
    kind: "active",
    nextPaymentDate: formatMembershipDate(nextPaymentIso),
    validUntilDate: formatMembershipDate(membership.endDate),
    renewalDate: formatMembershipDate(nextPaymentIso),
    periodStartDate: membership.currentPeriodStart ? formatMembershipDate(membership.currentPeriodStart) : null,
  };
}
