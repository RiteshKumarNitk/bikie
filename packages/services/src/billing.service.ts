import { billingRepository } from "@bikie/database";
import type { BillingHistoryDTO, InvoiceDetailDTO } from "@bikie/types";

/**
 * ADR-070 — read facade over a user's own membership billing receipts. Every method is scoped
 * to a `userId` the route resolves from the session; a client-supplied id is never accepted, and
 * `getInvoice` returns `null` for both "not found" and "not yours" so ids can't be probed.
 */
export const BillingService = {
  async getHistory(userId: string): Promise<BillingHistoryDTO> {
    return { invoices: await billingRepository.listForUser(userId) };
  },

  async getInvoice(userId: string, invoiceId: string): Promise<InvoiceDetailDTO | null> {
    return billingRepository.findByIdForUser(invoiceId, userId);
  },
};
