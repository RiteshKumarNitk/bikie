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
  // --- Recurring Razorpay Subscriptions — optional: absent/undefined for the existing
  // one-time/free/test-account rows (`getActiveMembership`/`findByPaymentReference`/
  // `createMembership` never set these), populated only for a subscription-backed row. ---
  razorpaySubscriptionId?: string | null;
  razorpayPlanId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  lastPaymentId?: string | null;
}
