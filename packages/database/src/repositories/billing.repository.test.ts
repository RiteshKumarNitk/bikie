import { afterEach, describe, expect, it, vi } from "vitest";

const inv = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("../client", () => ({ prisma: { membershipInvoice: inv } }));

import { createInvoice, findByIdForUser, listForUser } from "./billing.repository";

const D = (iso: string) => new Date(iso);
const dec = (n: number) => ({ toNumber: () => n });

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv-1",
    receiptNo: "BIKIE-2026-000006",
    userId: "user-1",
    accountType: "RIDER",
    userMembershipId: "um-1",
    partnerMembershipId: null,
    planId: "plan-1",
    planName: "Membership",
    amount: dec(99),
    currency: "INR",
    durationDays: 365,
    membershipStartDate: D("2026-08-30T00:00:00.000Z"),
    membershipEndDate: D("2027-08-30T00:00:00.000Z"),
    customerName: "Priya Verma",
    customerPhone: "+919876543210",
    status: "PAID",
    paymentId: "pay_abc",
    razorpayPaymentId: "pay_abc",
    razorpayOrderId: "order_abc",
    confirmationSmsSentAt: null,
    createdAt: D("2026-08-30T09:00:00.000Z"),
    paidAt: D("2026-08-30T09:00:00.000Z"),
    ...overrides,
  };
}

const baseInput = {
  userId: "user-1",
  accountType: "RIDER" as const,
  userMembershipId: "um-1",
  planId: "plan-1",
  planName: "Membership",
  amount: 99,
  durationDays: 365,
  membershipStartDate: D("2026-08-30T00:00:00.000Z"),
  membershipEndDate: D("2027-08-30T00:00:00.000Z"),
  customerName: "Priya Verma",
  customerPhone: "+919876543210",
  paymentId: "pay_abc",
  razorpayPaymentId: "pay_abc",
  razorpayOrderId: "order_abc",
  paidAt: D("2026-08-30T09:00:00.000Z"),
};

afterEach(() => vi.clearAllMocks());

describe("billing.repository.createInvoice — ADR-070", () => {
  it("mints a new receipt as BIKIE-<year>-<6 digits> and writes the full snapshot", async () => {
    inv.findFirst.mockResolvedValueOnce(null); // no existing
    inv.count.mockResolvedValueOnce(5); // 5 used this year → next is 000006
    inv.create.mockImplementationOnce(async ({ data }: { data: Record<string, unknown> }) => row({ receiptNo: data.receiptNo }));

    const result = await createInvoice(baseInput);

    const createArg = inv.create.mock.calls[0][0].data;
    expect(createArg.receiptNo).toBe(`BIKIE-${new Date().getFullYear()}-000006`);
    expect(createArg).toMatchObject({
      userId: "user-1",
      accountType: "RIDER",
      userMembershipId: "um-1",
      planName: "Membership",
      amount: 99,
      currency: "INR",
      durationDays: 365,
      razorpayPaymentId: "pay_abc",
    });
    expect(result.receiptNo).toBe(`BIKIE-${new Date().getFullYear()}-000006`);
    expect(result.amount).toBe(99);
  });

  it("is idempotent: an existing invoice for the same membership row is returned, no create", async () => {
    inv.findFirst.mockResolvedValueOnce(row());

    const result = await createInvoice(baseInput);

    expect(inv.create).not.toHaveBeenCalled();
    expect(result.id).toBe("inv-1");
    expect(result.receiptNo).toBe("BIKIE-2026-000006");
  });

  it("recovers from a P2002 race by returning the invoice the winner created", async () => {
    inv.findFirst
      .mockResolvedValueOnce(null) // pre-check: none
      .mockResolvedValueOnce(row()); // post-P2002: winner's row
    inv.count.mockResolvedValueOnce(0);
    inv.create.mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "P2002" }));

    const result = await createInvoice(baseInput);

    expect(result.id).toBe("inv-1");
  });

  it("snapshot is immutable — reads return the stored amount even if the plan later changes", async () => {
    // Invoice was written at ₹99; the plan is now ₹149. listForUser reads the STORED row.
    inv.findMany.mockResolvedValueOnce([row({ amount: dec(99) })]);

    const [summary] = await listForUser("user-1");

    expect(summary.amount).toBe(99); // not 149
  });
});

describe("billing.repository.findByIdForUser — ownership (IDOR)", () => {
  it("returns the invoice for its owner", async () => {
    inv.findUnique.mockResolvedValueOnce(row({ userId: "user-1" }));
    const result = await findByIdForUser("inv-1", "user-1");
    expect(result?.id).toBe("inv-1");
  });

  it("returns null when the invoice belongs to another user (no existence leak)", async () => {
    inv.findUnique.mockResolvedValueOnce(row({ userId: "someone-else" }));
    const result = await findByIdForUser("inv-1", "user-1");
    expect(result).toBeNull();
  });

  it("returns null when the invoice does not exist", async () => {
    inv.findUnique.mockResolvedValueOnce(null);
    const result = await findByIdForUser("nope", "user-1");
    expect(result).toBeNull();
  });
});
