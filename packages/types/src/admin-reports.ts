/** Admin-only financial reporting (ADR-076). Built from `MembershipInvoice` — the immutable
 * per-activation receipt (ADR-070) — so every amount is the purchase-time snapshot and is never
 * recomputed from a plan's current price. */

import type { InvoiceAccountTypeDTO, InvoicePaymentTypeDTO, InvoiceStatusDTO, InvoiceSubscriptionStateDTO } from "./billing";

/** One financial transaction row for the admin Transactions table. Maps 1:1 to a
 * `MembershipInvoice` today (every recorded transaction is a completed activation). */
export interface AdminTransactionDTO {
  id: string;
  receiptNo: string;
  userId: string;
  customerName: string;
  customerPhone: string | null;
  accountType: InvoiceAccountTypeDTO;
  planId: string;
  planName: string;
  /** Rupees, snapshot at purchase. `0` for a free-tier activation. */
  amount: number;
  currency: string;
  status: InvoiceStatusDTO;
  /** Razorpay payment id in real mode, a `DUMMY-…` string in dev-fallback mode, `null` for free. */
  paymentId: string | null;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  /** ISO 8601 */
  paidAt: string;
  membershipStartDate: string;
  membershipEndDate: string;
  durationDays: number;
  confirmationSmsSentAt: string | null;
  createdAt: string;
  /** `ONE_TIME` / `INITIAL_SUBSCRIPTION` / `AUTO_RENEWAL` — see `InvoicePaymentTypeDTO`. */
  paymentType: InvoicePaymentTypeDTO;
  /** The live Razorpay subscription state (next billing date, status, cancellation) — `null` for
   * a `ONE_TIME` transaction. Lets the admin drawer show "what happens next," not just "what was
   * paid," without the frontend ever computing or guessing a next-debit date. */
  subscription: InvoiceSubscriptionStateDTO | null;
}

export interface AdminTransactionListDTO {
  transactions: AdminTransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminTransactionFacetsDTO {
  /** Distinct plans seen across all recorded transactions, for the filter dropdown. */
  plans: { planId: string; planName: string }[];
}

export interface RevenueBucket {
  revenue: number;
  count: number;
}

export interface AdminRevenueReportDTO {
  range: { from: string; to: string; key: string };
  /** All-time and rolling-window totals (PAID invoices only). Independent of the selected range. */
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    inRange: number;
  };
  counts: {
    paidAllTime: number;
    paidInRange: number;
    refundedInRange: number;
  };
  refunds: { count: number; amount: number };
  byAccountType: { accountType: InvoiceAccountTypeDTO; revenue: number; count: number }[];
  byPlan: { planId: string; planName: string; revenue: number; count: number }[];
  byStatus: { status: InvoiceStatusDTO; count: number; amount: number }[];
  memberships: {
    activeRider: number;
    activeServiceProvider: number;
    newInRange: number;
    expiredInRange: number;
    expiringSoon: number;
  };
  /** Daily buckets across the selected range (revenue = PAID only). */
  timeSeries: { date: string; revenue: number; count: number }[];
}
