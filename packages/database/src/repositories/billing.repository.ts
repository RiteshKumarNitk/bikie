import type {
  AdminRevenueReportDTO,
  AdminTransactionDTO,
  InvoiceDetailDTO,
  InvoiceSummaryDTO,
} from "@bikie/types";
import { prisma } from "../client";
import { Prisma } from "../generated/prisma/client.js";
import { isUniqueViolation } from "../lib/prisma-errors";

/** ADR-070 — one immutable receipt per membership activation. Snapshot fields are written once
 * and never re-derived from the plan, so an admin changing a plan's price/duration later leaves
 * every historic invoice (and membership) untouched. */

type CreateInvoiceInput = {
  userId: string;
  accountType: "RIDER" | "SERVICE_PROVIDER";
  userMembershipId?: string | null;
  partnerMembershipId?: string | null;
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  durationDays: number;
  membershipStartDate: Date;
  membershipEndDate: Date;
  customerName: string;
  customerPhone?: string | null;
  paymentId?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  paidAt: Date;
};

type InvoiceRow = Awaited<ReturnType<typeof prisma.membershipInvoice.findFirstOrThrow>>;

function toSummary(inv: InvoiceRow): InvoiceSummaryDTO {
  return {
    id: inv.id,
    receiptNo: inv.receiptNo,
    accountType: inv.accountType as InvoiceSummaryDTO["accountType"],
    planName: inv.planName,
    amount: inv.amount.toNumber(),
    currency: inv.currency,
    status: inv.status as InvoiceSummaryDTO["status"],
    paidAt: inv.paidAt.toISOString(),
    membershipStartDate: inv.membershipStartDate.toISOString(),
    membershipEndDate: inv.membershipEndDate.toISOString(),
  };
}

function toDetail(inv: InvoiceRow): InvoiceDetailDTO {
  return {
    ...toSummary(inv),
    userId: inv.userId,
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    planId: inv.planId,
    durationDays: inv.durationDays,
    razorpayPaymentId: inv.razorpayPaymentId,
    razorpayOrderId: inv.razorpayOrderId,
    paymentId: inv.paymentId,
    confirmationSmsSentAt: inv.confirmationSmsSentAt ? inv.confirmationSmsSentAt.toISOString() : null,
    createdAt: inv.createdAt.toISOString(),
  };
}

/** `BIKIE-<year>-<6-digit sequence>`. The sequence is derived from the current per-year count;
 * a concurrent collision loses the `receiptNo` unique index and is retried by `createInvoice`. */
async function nextReceiptNo(): Promise<string> {
  const prefix = `BIKIE-${new Date().getFullYear()}-`;
  const used = await prisma.membershipInvoice.count({ where: { receiptNo: { startsWith: prefix } } });
  return `${prefix}${String(used + 1).padStart(6, "0")}`;
}

async function findExistingFor(input: CreateInvoiceInput): Promise<InvoiceRow | null> {
  const or: Array<Record<string, string>> = [];
  if (input.userMembershipId) or.push({ userMembershipId: input.userMembershipId });
  if (input.partnerMembershipId) or.push({ partnerMembershipId: input.partnerMembershipId });
  if (input.razorpayPaymentId) or.push({ razorpayPaymentId: input.razorpayPaymentId });
  if (input.paymentId) or.push({ paymentId: input.paymentId });
  if (or.length === 0) return null;
  return prisma.membershipInvoice.findFirst({ where: { OR: or } });
}

/**
 * Idempotent: if an invoice already exists for this membership row or payment reference it is
 * returned unchanged (a replayed `/purchase`, ADR-069). Otherwise a new receipt is minted,
 * retrying only on a `receiptNo` race.
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<InvoiceDetailDTO> {
  const existing = await findExistingFor(input);
  if (existing) return toDetail(existing);

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const inv = await prisma.membershipInvoice.create({
        data: {
          receiptNo: await nextReceiptNo(),
          userId: input.userId,
          accountType: input.accountType,
          userMembershipId: input.userMembershipId ?? null,
          partnerMembershipId: input.partnerMembershipId ?? null,
          planId: input.planId,
          planName: input.planName,
          amount: input.amount,
          currency: input.currency ?? "INR",
          durationDays: input.durationDays,
          membershipStartDate: input.membershipStartDate,
          membershipEndDate: input.membershipEndDate,
          customerName: input.customerName,
          customerPhone: input.customerPhone ?? null,
          paymentId: input.paymentId ?? null,
          razorpayPaymentId: input.razorpayPaymentId ?? null,
          razorpayOrderId: input.razorpayOrderId ?? null,
          paidAt: input.paidAt,
        },
      });
      return toDetail(inv);
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Either another request already invoiced this exact activation/payment (return it),
        // or a plain `receiptNo` collision (retry with a freshly recomputed sequence).
        const now = await findExistingFor(input);
        if (now) return toDetail(now);
        continue;
      }
      throw err;
    }
  }
  throw new Error("[billing.repository] could not allocate a unique receipt number after 6 attempts");
}

/** Newest first. Scoped to one user — the route never accepts a userId from the client. */
export async function listForUser(userId: string): Promise<InvoiceSummaryDTO[]> {
  const rows = await prisma.membershipInvoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toSummary);
}

/** Returns `null` both when the invoice does not exist and when it belongs to another user —
 * the caller maps both to 404, so invoice ids can't be probed. */
export async function findByIdForUser(id: string, userId: string): Promise<InvoiceDetailDTO | null> {
  const inv = await prisma.membershipInvoice.findUnique({ where: { id } });
  if (!inv || inv.userId !== userId) return null;
  return toDetail(inv);
}

/** Stamps the "confirmation SMS delivered" marker once. No-op if already set (so a retry that
 * races a first success can't move the timestamp). */
export async function markConfirmationSmsSent(invoiceId: string): Promise<void> {
  await prisma.membershipInvoice.updateMany({
    where: { id: invoiceId, confirmationSmsSentAt: null },
    data: { confirmationSmsSentAt: new Date() },
  });
}

// --- Admin financial reporting (ADR-076) ---------------------------------------------------
// Every figure below comes from `MembershipInvoice` snapshot columns, so historic amounts are
// always what was actually paid at the time — never recomputed from a plan's current price.

export type AdminTransactionFilters = {
  accountType?: "RIDER" | "SERVICE_PROVIDER";
  status?: "PAID" | "REFUNDED";
  planId?: string;
  /** paidAt >= from */
  from?: Date;
  /** paidAt <= to */
  to?: Date;
  /** case-insensitive contains across receiptNo / customerName / customerPhone /
   * razorpayPaymentId / razorpayOrderId / paymentId */
  search?: string;
};

function transactionWhere(f: AdminTransactionFilters): Prisma.MembershipInvoiceWhereInput {
  const where: Prisma.MembershipInvoiceWhereInput = {};
  if (f.accountType) where.accountType = f.accountType;
  if (f.status) where.status = f.status;
  if (f.planId) where.planId = f.planId;
  if (f.from || f.to) {
    where.paidAt = {};
    if (f.from) where.paidAt.gte = f.from;
    if (f.to) where.paidAt.lte = f.to;
  }
  const q = f.search?.trim();
  if (q) {
    where.OR = [
      { receiptNo: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q } },
      { razorpayPaymentId: { contains: q } },
      { razorpayOrderId: { contains: q } },
      { paymentId: { contains: q } },
    ];
  }
  return where;
}

function toAdminTransaction(inv: InvoiceRow): AdminTransactionDTO {
  return {
    id: inv.id,
    receiptNo: inv.receiptNo,
    userId: inv.userId,
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    accountType: inv.accountType as AdminTransactionDTO["accountType"],
    planId: inv.planId,
    planName: inv.planName,
    amount: inv.amount.toNumber(),
    currency: inv.currency,
    status: inv.status as AdminTransactionDTO["status"],
    paymentId: inv.paymentId,
    razorpayPaymentId: inv.razorpayPaymentId,
    razorpayOrderId: inv.razorpayOrderId,
    paidAt: inv.paidAt.toISOString(),
    membershipStartDate: inv.membershipStartDate.toISOString(),
    membershipEndDate: inv.membershipEndDate.toISOString(),
    durationDays: inv.durationDays,
    confirmationSmsSentAt: inv.confirmationSmsSentAt ? inv.confirmationSmsSentAt.toISOString() : null,
    createdAt: inv.createdAt.toISOString(),
  };
}

/** Server-side paginated + filtered transaction list, newest or oldest first. */
export async function listTransactionsForAdmin(
  filters: AdminTransactionFilters,
  opts: { page: number; pageSize: number; sort: "newest" | "oldest" },
): Promise<{ transactions: AdminTransactionDTO[]; total: number }> {
  const where = transactionWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.membershipInvoice.findMany({
      where,
      orderBy: { paidAt: opts.sort === "oldest" ? "asc" : "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.membershipInvoice.count({ where }),
  ]);
  return { transactions: rows.map(toAdminTransaction), total };
}

/** Unpaginated, for CSV export — caller applies `MAX_ADMIN_CSV_ROWS`. */
export async function listAllTransactionsForAdmin(
  filters: AdminTransactionFilters,
  opts: { sort: "newest" | "oldest"; limit: number },
): Promise<AdminTransactionDTO[]> {
  const rows = await prisma.membershipInvoice.findMany({
    where: transactionWhere(filters),
    orderBy: { paidAt: opts.sort === "oldest" ? "asc" : "desc" },
    take: opts.limit,
  });
  return rows.map(toAdminTransaction);
}

export async function getTransactionForAdmin(id: string): Promise<AdminTransactionDTO | null> {
  const inv = await prisma.membershipInvoice.findUnique({ where: { id } });
  return inv ? toAdminTransaction(inv) : null;
}

/** Distinct (planId, planName) pairs across all recorded transactions — powers the filter menu. */
export async function listTransactionPlanFacets(): Promise<{ planId: string; planName: string }[]> {
  const rows = await prisma.membershipInvoice.findMany({
    distinct: ["planId"],
    select: { planId: true, planName: true },
    orderBy: { planName: "asc" },
  });
  return rows;
}

function dec(v: Prisma.Decimal | null | undefined): number {
  return v ? Number(v) : 0;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Aggregated revenue + membership report for the admin Reports page. `from`/`to` bound the
 * range-scoped figures; the rolling `revenue.{today,thisWeek,thisMonth,thisYear}` totals and the
 * all-time / live-membership counts ignore the range by design. */
export async function getRevenueReport(range: {
  from: Date;
  to: Date;
  key: string;
}): Promise<AdminRevenueReportDTO> {
  const now = new Date();
  const paid = (extra: Prisma.MembershipInvoiceWhereInput = {}) =>
    prisma.membershipInvoice.aggregate({
      where: { status: "PAID", ...extra },
      _sum: { amount: true },
      _count: true,
    });

  const rangeWhere = { paidAt: { gte: range.from, lte: range.to } };
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalAgg,
    todayAgg,
    weekAgg,
    monthAgg,
    yearAgg,
    inRangeAgg,
    refundedInRangeAgg,
    byAccountTypeRows,
    byPlanRows,
    byStatusRows,
    seriesRows,
    activeRider,
    activeServiceProvider,
    newInRange,
    expiredRider,
    expiredSp,
    expiringRider,
    expiringSp,
  ] = await Promise.all([
    paid(),
    paid({ paidAt: { gte: startOfUtcDay(now) } }),
    paid({ paidAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }),
    paid({ paidAt: { gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) } }),
    paid({ paidAt: { gte: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) } }),
    paid(rangeWhere),
    prisma.membershipInvoice.aggregate({
      where: { status: "REFUNDED", ...rangeWhere },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.membershipInvoice.groupBy({
      by: ["accountType"],
      where: { status: "PAID", ...rangeWhere },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.membershipInvoice.groupBy({
      by: ["planId", "planName"],
      where: { status: "PAID", ...rangeWhere },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.membershipInvoice.groupBy({
      by: ["status"],
      where: rangeWhere,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.membershipInvoice.findMany({
      where: rangeWhere,
      select: { paidAt: true, amount: true, status: true },
    }),
    prisma.userMembership.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
    prisma.partnerMembership.count({ where: { status: "ACTIVE", endDate: { gte: now } } }),
    prisma.membershipInvoice.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    prisma.userMembership.count({ where: { endDate: { gte: range.from, lte: range.to } } }),
    prisma.partnerMembership.count({ where: { endDate: { gte: range.from, lte: range.to } } }),
    prisma.userMembership.count({ where: { status: "ACTIVE", endDate: { gte: now, lte: soon } } }),
    prisma.partnerMembership.count({ where: { status: "ACTIVE", endDate: { gte: now, lte: soon } } }),
  ]);

  const dayMap = new Map<string, { revenue: number; count: number }>();
  for (const r of seriesRows) {
    const key = r.paidAt.toISOString().slice(0, 10);
    const cur = dayMap.get(key) ?? { revenue: 0, count: 0 };
    if (r.status === "PAID") {
      cur.revenue += Number(r.amount);
      cur.count += 1;
    }
    dayMap.set(key, cur);
  }
  const timeSeries = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, revenue: d.revenue, count: d.count }));

  const byStatus = (["PAID", "REFUNDED"] as const).map((status) => {
    const row = byStatusRows.find((r) => r.status === status);
    return { status, count: row?._count ?? 0, amount: dec(row?._sum.amount) };
  });

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString(), key: range.key },
    revenue: {
      total: dec(totalAgg._sum.amount),
      today: dec(todayAgg._sum.amount),
      thisWeek: dec(weekAgg._sum.amount),
      thisMonth: dec(monthAgg._sum.amount),
      thisYear: dec(yearAgg._sum.amount),
      inRange: dec(inRangeAgg._sum.amount),
    },
    counts: {
      paidAllTime: totalAgg._count,
      paidInRange: inRangeAgg._count,
      refundedInRange: refundedInRangeAgg._count,
    },
    refunds: { count: refundedInRangeAgg._count, amount: dec(refundedInRangeAgg._sum.amount) },
    byAccountType: byAccountTypeRows.map((r) => ({
      accountType: r.accountType as "RIDER" | "SERVICE_PROVIDER",
      revenue: dec(r._sum.amount),
      count: r._count,
    })),
    byPlan: byPlanRows
      .map((r) => ({
        planId: r.planId,
        planName: r.planName,
        revenue: dec(r._sum.amount),
        count: r._count,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    byStatus,
    memberships: {
      activeRider,
      activeServiceProvider,
      newInRange,
      expiredInRange: expiredRider + expiredSp,
      expiringSoon: expiringRider + expiringSp,
    },
    timeSeries,
  };
}
