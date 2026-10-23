/** ADR-070 — membership billing receipts. One immutable invoice per membership activation, for
 * both account types. Every value here is a purchase-time SNAPSHOT — an admin later changing a
 * plan's price or duration never alters a historic invoice. */

export type InvoiceStatusDTO = "PAID" | "REFUNDED";
export type InvoiceAccountTypeDTO = "RIDER" | "SERVICE_PROVIDER";

/** `ONE_TIME` — a Rider annual purchase, or an SP membership bought via the one-time/free path
 * (never recurring). `INITIAL_SUBSCRIPTION` — the first, authorization-triggered charge on a
 * recurring SP subscription. `AUTO_RENEWAL` — a later, webhook-confirmed recurring charge on the
 * same subscription. Derived server-side (earliest `paidAt` among a subscription's own invoices
 * = initial, every later one = auto-renewal) — never guessed by the client. */
export type InvoicePaymentTypeDTO = "ONE_TIME" | "INITIAL_SUBSCRIPTION" | "AUTO_RENEWAL";

export interface InvoiceSummaryDTO {
  id: string;
  receiptNo: string;
  accountType: InvoiceAccountTypeDTO;
  planName: string;
  /** Rupees, snapshot at purchase. `0` for a free-tier activation. */
  amount: number;
  currency: string;
  status: InvoiceStatusDTO;
  /** ISO 8601 */
  paidAt: string;
  membershipStartDate: string;
  membershipEndDate: string;
  paymentType: InvoicePaymentTypeDTO;
}

/** The live Razorpay subscription state as of whenever this invoice is read — `null` for a
 * `ONE_TIME` invoice. Lets a single receipt independently show "what you paid then" (the
 * invoice's own snapshot fields) alongside "what happens next" (the subscription's current
 * state) — both server-authoritative, neither guessed by the client. */
export interface InvoiceSubscriptionStateDTO {
  razorpaySubscriptionId: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  /** The END of the membership period that `currentPeriodEnd`'s charge would start, i.e. the
   * *next* renewal's own expiry — `currentPeriodEnd + this invoice's own durationDays`, the same
   * arithmetic every `endDate`/`currentPeriodEnd` on this row was already computed with. `null`
   * whenever `currentPeriodEnd` itself is `null` (no charge confirmed yet) or the subscription is
   * cancelled (there is no next period). Computed server-side so the client never derives it. */
  nextPeriodEnd: string | null;
  /** How many *recurring* (`AUTO_RENEWAL`) charges this subscription has collected so far —
   * total invoices on the subscription minus the one `INITIAL_SUBSCRIPTION` charge. `0` right
   * after authorization, before the first renewal has landed. */
  renewalCount: number;
}

export interface InvoiceDetailDTO extends InvoiceSummaryDTO {
  userId: string;
  customerName: string;
  customerPhone: string | null;
  planId: string;
  durationDays: number;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  /** The raw payment reference stored on the membership row — the Razorpay payment id in real
   * mode, a `DUMMY-…` string in dev-fallback mode, `null` for a free activation. */
  paymentId: string | null;
  confirmationSmsSentAt: string | null;
  createdAt: string;
  subscription: InvoiceSubscriptionStateDTO | null;
}

export interface BillingHistoryDTO {
  invoices: InvoiceSummaryDTO[];
}
