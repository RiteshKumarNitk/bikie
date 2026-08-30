/** ADR-070 — membership billing receipts. One immutable invoice per membership activation, for
 * both account types. Every value here is a purchase-time SNAPSHOT — an admin later changing a
 * plan's price or duration never alters a historic invoice. */

export type InvoiceStatusDTO = "PAID" | "REFUNDED";
export type InvoiceAccountTypeDTO = "RIDER" | "SERVICE_PROVIDER";

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
}

export interface BillingHistoryDTO {
  invoices: InvoiceSummaryDTO[];
}
