import { billingRepository } from "@bikie/database";
import type {
  AdminRevenueReportDTO,
  AdminTransactionDTO,
  AdminTransactionListDTO,
} from "@bikie/types";
import { buildCsv, MAX_ADMIN_CSV_ROWS } from "./modules/administration/domain/csv";

/**
 * ADR-076 — admin-only read facade over the membership billing ledger (`MembershipInvoice`,
 * ADR-070). Every amount is the purchase-time snapshot; nothing here recomputes revenue from a
 * plan's current price. Authorization is enforced by the route (`requireRole("ADMIN")`), never
 * here — this service trusts its caller, exactly like `AdminService`.
 */
export type AdminTransactionQuery = {
  page: number;
  pageSize: number;
  sort: "newest" | "oldest";
  accountType?: "RIDER" | "SERVICE_PROVIDER";
  status?: "PAID" | "REFUNDED";
  planId?: string;
  from?: Date;
  to?: Date;
  search?: string;
};

function filtersOf(q: AdminTransactionQuery) {
  return {
    accountType: q.accountType,
    status: q.status,
    planId: q.planId,
    from: q.from,
    to: q.to,
    search: q.search,
  };
}

export const AdminBillingService = {
  async listTransactions(q: AdminTransactionQuery): Promise<AdminTransactionListDTO> {
    const { transactions, total } = await billingRepository.listTransactionsForAdmin(filtersOf(q), {
      page: q.page,
      pageSize: q.pageSize,
      sort: q.sort,
    });
    return {
      transactions,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  },

  getTransaction(id: string): Promise<AdminTransactionDTO | null> {
    return billingRepository.getTransactionForAdmin(id);
  },

  listPlanFacets() {
    return billingRepository.listTransactionPlanFacets();
  },

  getRevenueReport(range: { from: Date; to: Date; key: string }): Promise<AdminRevenueReportDTO> {
    return billingRepository.getRevenueReport(range);
  },

  /** CSV of the filtered transaction set (ignores pagination, capped at `MAX_ADMIN_CSV_ROWS`). */
  async exportTransactionsCsv(q: AdminTransactionQuery): Promise<{ csv: string; filename: string }> {
    const rows = await billingRepository.listAllTransactionsForAdmin(filtersOf(q), {
      sort: q.sort,
      limit: MAX_ADMIN_CSV_ROWS,
    });
    const csv = buildCsv(
      rows.map((t) => ({
        receiptNo: t.receiptNo,
        paidAt: t.paidAt,
        status: t.status,
        accountType: t.accountType,
        customerName: t.customerName,
        customerPhone: t.customerPhone ?? "",
        planName: t.planName,
        amount: t.amount,
        currency: t.currency,
        razorpayPaymentId: t.razorpayPaymentId ?? "",
        razorpayOrderId: t.razorpayOrderId ?? "",
        paymentId: t.paymentId ?? "",
        membershipStartDate: t.membershipStartDate,
        membershipEndDate: t.membershipEndDate,
        durationDays: t.durationDays,
        userId: t.userId,
      })),
    );
    return { csv, filename: `transactions-${new Date().toISOString().slice(0, 10)}.csv` };
  },
};
