export interface MembershipPlanDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  benefits: string[];
  isActive: boolean;
}

export interface UserMembershipDTO {
  id: string;
  userId: string;
  planId: string;
  plan: MembershipPlanDTO;
  startDate: string;
  endDate: string;
  status: string;
  daysLeft: number;
  // --- Recurring Razorpay Subscriptions — optional: `null` for a one-time/free/legacy row
  // (`findByPaymentReference`/`createMembership` never set these columns), populated whenever
  // the row is subscription-backed. Mirrors `PartnerMembershipDTO`'s identical fields (Service
  // Provider ₹99/month) exactly — Rider is ₹149/year, same shape, entirely separate rows/table.
  razorpaySubscriptionId?: string | null;
  razorpayPlanId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
  lastPaymentId?: string | null;
}

/** Admin-only — every `UserMembership` row that's ever been subscription-backed
 * (`razorpaySubscriptionId != null`), with the owning user's identity joined in. Mirrors
 * `AdminPartnerSubscriptionDTO` exactly. */
export interface AdminUserSubscriptionDTO extends UserMembershipDTO {
  userName: string;
  userEmail: string;
  userPhone: string | null;
}