/** ADR-051 — a Service Provider's own membership, entirely separate from MembershipPlanDTO/
 * UserMembershipDTO (Rider). */

export interface PartnerMembershipPlanDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  isActive: boolean;
}

export interface PartnerMembershipDTO {
  id: string;
  userId: string;
  planId: string;
  plan: PartnerMembershipPlanDTO;
  startDate: string;
  endDate: string;
  status: string;
  daysLeft: number;
  // --- Recurring Razorpay Subscriptions — optional: `null` for a one-time/free/test-account
  // row (`findByPaymentReference`/`createMembership` never set these columns), populated
  // whenever the row is subscription-backed (every reader, including `getActiveMembership`,
  // goes through `toMembershipDTO` and surfaces whatever the row actually has). ---
  razorpaySubscriptionId?: string | null;
  razorpayPlanId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  lastPaymentId?: string | null;
}

/** Admin-only — every `PartnerMembership` row that's ever been subscription-backed
 * (`razorpaySubscriptionId != null`), with the owning user's identity joined in, so an admin can
 * see "who's subscribed" without opening each partner's detail page one at a time. Includes a
 * subscription that was created but never activated (no payment yet) — the exact case a webhook
 * failure can otherwise leave invisible everywhere else in the admin panel. */
export interface AdminPartnerSubscriptionDTO extends PartnerMembershipDTO {
  userName: string;
  userEmail: string;
  userPhone: string | null;
}
