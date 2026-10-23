import { afterEach, describe, expect, it, vi } from "vitest";

const inv = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
  groupBy: vi.fn(),
}));

vi.mock("../client", () => ({ prisma: { membershipInvoice: inv } }));

import {
  createInvoice,
  findByIdForUser,
  getTransactionForAdmin,
  listForUser,
  listTransactionsForAdmin,
} from "./billing.repository";

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
    partnerMembership: null,
    ...overrides,
  };
}

/** A subscription-backed invoice row (`include: membershipPaymentTypeInclude`'s shape). The real
 * Golden Service Provider Community plan is ₹99/month (`durationDays: 30`), not the base
 * fixture's 365-day Rider default. */
function subscriptionRow(overrides: Record<string, unknown> = {}) {
  return row({
    accountType: "SERVICE_PROVIDER",
    userMembershipId: null,
    durationDays: 30,
    partnerMembershipId: "pm-1",
    razorpayOrderId: null,
    paymentId: null,
    partnerMembership: {
      razorpaySubscriptionId: "sub_1",
      subscriptionStatus: "active",
      currentPeriodEnd: D("2026-11-23T00:00:00.000Z"),
      cancelledAt: null,
    },
    ...overrides,
  });
}

/** Stubs the `groupBy` call `paymentTypesFor` makes for a single membership id. */
function stubGroupBy(partnerMembershipId: string, earliestPaidAt: Date, totalCount: number) {
  inv.groupBy.mockResolvedValueOnce([
    { partnerMembershipId, _min: { paidAt: earliestPaidAt }, _count: { _all: totalCount } },
  ]);
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
    expect(result.paymentType).toBe("ONE_TIME");
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

describe("billing.repository — recurring-subscription paymentType/subscription labeling (user-facing)", () => {
  it("listForUser: a one-time Rider invoice is ONE_TIME with no subscription state, no groupBy needed", async () => {
    inv.findMany.mockResolvedValueOnce([row()]);

    const [summary] = await listForUser("user-1");

    expect(summary.paymentType).toBe("ONE_TIME");
    expect(inv.groupBy).not.toHaveBeenCalled();
  });

  it("listForUser: the earliest invoice for a subscription is the initial charge, later ones are auto-renewals", async () => {
    inv.findMany.mockResolvedValueOnce([
      // Newest first, as the real query orders them.
      subscriptionRow({ id: "inv-3", paidAt: D("2026-12-23T09:00:00.000Z") }),
      subscriptionRow({ id: "inv-2", paidAt: D("2026-11-23T09:00:00.000Z") }),
      subscriptionRow({ id: "inv-1", paidAt: D("2026-10-23T09:00:00.000Z") }), // first charge
    ]);
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 3);

    const result = await listForUser("user-1");

    expect(result.find((r) => r.id === "inv-1")?.paymentType).toBe("INITIAL_SUBSCRIPTION");
    expect(result.find((r) => r.id === "inv-2")?.paymentType).toBe("AUTO_RENEWAL");
    expect(result.find((r) => r.id === "inv-3")?.paymentType).toBe("AUTO_RENEWAL");
  });

  it("listForUser: a one-time SP purchase (partnerMembershipId set, but no razorpaySubscriptionId on the membership) is still ONE_TIME", async () => {
    inv.findMany.mockResolvedValueOnce([row({ partnerMembershipId: "pm-2", partnerMembership: null })]);

    const [summary] = await listForUser("user-1");

    expect(summary.paymentType).toBe("ONE_TIME");
  });

  it("findByIdForUser: an active, healthy renewal carries the live subscription state, correct paymentType, and renewalCount", async () => {
    inv.findUnique.mockResolvedValueOnce(
      subscriptionRow({
        id: "inv-2",
        paidAt: D("2026-11-23T09:00:00.000Z"),
        partnerMembership: {
          razorpaySubscriptionId: "sub_1",
          subscriptionStatus: "active",
          currentPeriodEnd: D("2026-12-23T00:00:00.000Z"),
          cancelledAt: null,
        },
      }),
    );
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2); // initial + this one = 2 total

    const result = await findByIdForUser("inv-2", "user-1");

    expect(result?.paymentType).toBe("AUTO_RENEWAL");
    expect(result?.subscription).toEqual({
      razorpaySubscriptionId: "sub_1",
      status: "active",
      currentPeriodEnd: "2026-12-23T00:00:00.000Z",
      nextPeriodEnd: "2027-01-22T00:00:00.000Z", // currentPeriodEnd + this invoice's 30-day duration
      cancelledAt: null,
      renewalCount: 1, // 2 total invoices - the 1 initial charge
    });
  });

  it("findByIdForUser: the authorization charge itself (sole invoice) is INITIAL_SUBSCRIPTION with renewalCount 0", async () => {
    const paidAt = D("2026-10-23T09:00:00.000Z");
    inv.findUnique.mockResolvedValueOnce(subscriptionRow({ paidAt }));
    stubGroupBy("pm-1", paidAt, 1); // only this one exists so far — it IS the earliest

    const result = await findByIdForUser("inv-1", "user-1");

    expect(result?.paymentType).toBe("INITIAL_SUBSCRIPTION");
    expect(result?.subscription?.renewalCount).toBe(0);
  });

  it("findByIdForUser: a cancelled subscription's invoice reflects cancelledAt and has no nextPeriodEnd", async () => {
    inv.findUnique.mockResolvedValueOnce(
      subscriptionRow({
        partnerMembership: {
          razorpaySubscriptionId: "sub_1",
          subscriptionStatus: "active",
          currentPeriodEnd: D("2026-11-23T00:00:00.000Z"),
          cancelledAt: D("2026-10-25T00:00:00.000Z"),
        },
      }),
    );
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 1);

    const result = await findByIdForUser("inv-1", "user-1");

    expect(result?.subscription?.cancelledAt).toBe("2026-10-25T00:00:00.000Z");
    expect(result?.subscription?.nextPeriodEnd).toBeNull(); // cancelled — no next period to compute
  });

  it("findByIdForUser: a halted (failed) subscription still reports its raw status, with no nextPeriodEnd fabricated", async () => {
    inv.findUnique.mockResolvedValueOnce(
      subscriptionRow({
        partnerMembership: {
          razorpaySubscriptionId: "sub_1",
          subscriptionStatus: "halted",
          currentPeriodEnd: D("2026-11-23T00:00:00.000Z"),
          cancelledAt: null,
        },
      }),
    );
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2);

    const result = await findByIdForUser("inv-1", "user-1");

    expect(result?.subscription?.status).toBe("halted");
    // Not cancelled, so nextPeriodEnd IS still computed from currentPeriodEnd — a halted payment
    // doesn't retroactively erase the last known billing schedule, it's surfaced as a warning by
    // the UI layer instead (subscription.status !== a healthy value).
    expect(result?.subscription?.nextPeriodEnd).not.toBeNull();
  });
});

describe("admin transactions — paymentType/subscription/renewalCount computed GLOBALLY, not just within a page", () => {
  it("getTransactionForAdmin: an active subscription transaction carries paymentType and next-debit data", async () => {
    inv.findUnique.mockResolvedValueOnce(subscriptionRow({ id: "inv-2", paidAt: D("2026-11-23T09:00:00.000Z") }));
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2);

    const result = await getTransactionForAdmin("inv-2");

    expect(result?.paymentType).toBe("AUTO_RENEWAL");
    expect(result?.subscription).toEqual({
      razorpaySubscriptionId: "sub_1",
      status: "active",
      currentPeriodEnd: "2026-11-23T00:00:00.000Z",
      nextPeriodEnd: "2026-12-23T00:00:00.000Z",
      cancelledAt: null,
      renewalCount: 1,
    });
  });

  it("getTransactionForAdmin: a cancelled subscription shows cancelledAt and no next debit", async () => {
    inv.findUnique.mockResolvedValueOnce(
      subscriptionRow({
        partnerMembership: {
          razorpaySubscriptionId: "sub_1",
          subscriptionStatus: "cancelled",
          currentPeriodEnd: D("2026-11-23T00:00:00.000Z"),
          cancelledAt: D("2026-10-28T00:00:00.000Z"),
        },
      }),
    );
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 1);

    const result = await getTransactionForAdmin("inv-1");

    expect(result?.subscription?.cancelledAt).toBe("2026-10-28T00:00:00.000Z");
    expect(result?.subscription?.nextPeriodEnd).toBeNull();
  });

  it("getTransactionForAdmin: a halted subscription reports status halted for the admin to see", async () => {
    inv.findUnique.mockResolvedValueOnce(
      subscriptionRow({
        partnerMembership: {
          razorpaySubscriptionId: "sub_1",
          subscriptionStatus: "halted",
          currentPeriodEnd: D("2026-11-23T00:00:00.000Z"),
          cancelledAt: null,
        },
      }),
    );
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2);

    const result = await getTransactionForAdmin("inv-1");

    expect(result?.subscription?.status).toBe("halted");
  });

  it("getTransactionForAdmin: a pending subscription reports status pending", async () => {
    inv.findUnique.mockResolvedValueOnce(
      subscriptionRow({
        partnerMembership: {
          razorpaySubscriptionId: "sub_1",
          subscriptionStatus: "pending",
          currentPeriodEnd: D("2026-11-23T00:00:00.000Z"),
          cancelledAt: null,
        },
      }),
    );
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2);

    const result = await getTransactionForAdmin("inv-1");

    expect(result?.subscription?.status).toBe("pending");
  });

  it("getTransactionForAdmin: the authorization charge is INITIAL_SUBSCRIPTION with renewalCount 0", async () => {
    const paidAt = D("2026-10-23T09:00:00.000Z");
    inv.findUnique.mockResolvedValueOnce(subscriptionRow({ paidAt }));
    stubGroupBy("pm-1", paidAt, 1);

    const result = await getTransactionForAdmin("inv-1");

    expect(result?.paymentType).toBe("INITIAL_SUBSCRIPTION");
    expect(result?.subscription?.renewalCount).toBe(0);
  });

  it("getTransactionForAdmin: a one-time Rider transaction has no subscription state at all", async () => {
    inv.findUnique.mockResolvedValueOnce(row());

    const result = await getTransactionForAdmin("inv-1");

    expect(result?.paymentType).toBe("ONE_TIME");
    expect(result?.subscription).toBeNull();
    expect(inv.groupBy).not.toHaveBeenCalled();
  });

  it("listTransactionsForAdmin: a renewal on page 2 is still correctly labeled even though its initial charge is on page 1 (earliest/count computed globally via groupBy, not from the current page's rows alone)", async () => {
    // Page 2 of the admin list contains ONLY the renewal — the initial charge (the true earliest)
    // is on page 1 and never appears in `rows` here. If the code mistakenly computed "earliest"
    // from just this page's rows, it would wrongly treat this lone row as the initial charge.
    inv.findMany.mockResolvedValueOnce([subscriptionRow({ id: "inv-2", paidAt: D("2026-11-23T09:00:00.000Z") })]);
    inv.count.mockResolvedValueOnce(2);
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2); // 2 total invoices for this subscription, globally

    const result = await listTransactionsForAdmin({}, { page: 2, pageSize: 1, sort: "newest" });

    expect(result.transactions[0].paymentType).toBe("AUTO_RENEWAL");
    expect(result.transactions[0].subscription?.renewalCount).toBe(1);
  });

  it("listTransactionsForAdmin: distinguishes ONE_TIME / INITIAL_SUBSCRIPTION / AUTO_RENEWAL within the same page", async () => {
    inv.findMany.mockResolvedValueOnce([
      row({ id: "inv-rider" }), // ONE_TIME
      subscriptionRow({ id: "inv-initial", paidAt: D("2026-10-23T09:00:00.000Z") }),
      subscriptionRow({ id: "inv-renewal", paidAt: D("2026-11-23T09:00:00.000Z") }),
    ]);
    inv.count.mockResolvedValueOnce(3);
    stubGroupBy("pm-1", D("2026-10-23T09:00:00.000Z"), 2);

    const result = await listTransactionsForAdmin({}, { page: 1, pageSize: 25, sort: "newest" });

    const byId = Object.fromEntries(result.transactions.map((t) => [t.id, t.paymentType]));
    expect(byId["inv-rider"]).toBe("ONE_TIME");
    expect(byId["inv-initial"]).toBe("INITIAL_SUBSCRIPTION");
    expect(byId["inv-renewal"]).toBe("AUTO_RENEWAL");
  });

  it("listTransactionsForAdmin: a one-time Rider transaction is ONE_TIME with no subscription state, and groupBy is never called", async () => {
    inv.findMany.mockResolvedValueOnce([row()]);
    inv.count.mockResolvedValueOnce(1);

    const result = await listTransactionsForAdmin({}, { page: 1, pageSize: 25, sort: "newest" });

    expect(result.transactions[0].paymentType).toBe("ONE_TIME");
    expect(result.transactions[0].subscription).toBeNull();
    expect(inv.groupBy).not.toHaveBeenCalled();
  });
});
