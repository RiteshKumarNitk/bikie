import { describe, expect, it } from "vitest";
import type { InvoiceDetailDTO } from "@bikie/types";
import { renderReceiptHtml } from "./receipt-html";

const base: InvoiceDetailDTO = {
  id: "inv-1",
  receiptNo: "BIKIE-2026-000001",
  accountType: "RIDER",
  planName: "Membership",
  amount: 149,
  currency: "INR",
  status: "PAID",
  paidAt: "2026-10-26T00:00:00.000Z",
  membershipStartDate: "2026-10-26T00:00:00.000Z",
  membershipEndDate: "2027-10-26T00:00:00.000Z",
  paymentType: "INITIAL_SUBSCRIPTION",
  userId: "user-1",
  customerName: "Priya Verma",
  customerPhone: "+919876543210",
  planId: "plan-1",
  durationDays: 365,
  razorpayPaymentId: "pay_1",
  razorpayOrderId: null,
  paymentId: "pay_1",
  confirmationSmsSentAt: null,
  createdAt: "2026-10-26T00:00:00.000Z",
  subscription: {
    razorpaySubscriptionId: "sub_rider123",
    status: "active",
    currentPeriodEnd: "2027-10-26T00:00:00.000Z",
    cancelledAt: null,
    nextPeriodEnd: "2028-10-26T00:00:00.000Z",
    renewalCount: 0,
  },
};

describe("renderReceiptHtml — payment type label is billing-cadence-aware, never hardcoded to one account type", () => {
  it("labels a Rider's (365-day) initial subscription charge 'Yearly Auto-Renewal', not 'Monthly'", () => {
    const html = renderReceiptHtml(base);

    expect(html).toContain("Yearly Auto-Renewal");
    expect(html).not.toContain("Monthly Auto-Renewal");
  });

  it("labels a Service Provider's (30-day) initial subscription charge 'Monthly Auto-Renewal'", () => {
    const html = renderReceiptHtml({ ...base, accountType: "SERVICE_PROVIDER", durationDays: 30, amount: 99 });

    expect(html).toContain("Monthly Auto-Renewal");
    expect(html).not.toContain("Yearly Auto-Renewal");
  });

  it("falls back to 'Every N days' for a non-30/365 duration, never guessing Monthly or Yearly", () => {
    const html = renderReceiptHtml({ ...base, durationDays: 90 });

    expect(html).toContain("Every 90 days Auto-Renewal");
  });

  it("labels a later recurring charge 'Automatic Renewal' regardless of cadence", () => {
    const html = renderReceiptHtml({ ...base, paymentType: "AUTO_RENEWAL" });

    expect(html).toContain("Automatic Renewal");
    expect(html).not.toContain("Yearly Auto-Renewal");
  });

  it("omits the Payment type row entirely for a one-time purchase (no subscription section at all)", () => {
    const html = renderReceiptHtml({ ...base, paymentType: "ONE_TIME", subscription: null });

    expect(html).not.toContain("Payment type");
    expect(html).not.toContain("Auto-renewal");
    expect(html).not.toContain("Next automatic payment");
  });

  it("shows the correct account label for each account type", () => {
    expect(renderReceiptHtml(base)).toContain("Rider");
    expect(renderReceiptHtml({ ...base, accountType: "SERVICE_PROVIDER" })).toContain("Service Provider");
  });
});
