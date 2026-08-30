import type { InvoiceDetailDTO, InvoiceSummaryDTO } from "@bikie/types";
import { prisma } from "../client";
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
