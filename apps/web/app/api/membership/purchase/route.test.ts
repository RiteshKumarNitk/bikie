/**
 * Mirrors ../checkout/route.test.ts and ../../partner-membership/purchase/route.test.ts — Rider
 * membership is now yearly-auto-debit-only, so this route must reject a one-time purchase for any
 * paid plan except the Rider test account. `MembershipService` is mocked; `purchaseMembership`'s
 * own logic is covered in packages/services/src/membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { getPlanById, isPaymentExemptTestAccount, purchaseMembership, getActiveMembership } = vi.hoisted(() => ({
  getPlanById: vi.fn(),
  isPaymentExemptTestAccount: vi.fn(),
  purchaseMembership: vi.fn(),
  getActiveMembership: vi.fn(),
}));

vi.mock("@bikie/services", () => ({
  MembershipService: { getPlanById, isPaymentExemptTestAccount, purchaseMembership, getActiveMembership },
}));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { POST } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

function request(body: object) {
  return new Request("http://localhost/api/membership/purchase", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/membership/purchase", () => {
  it("still activates a free plan with no payment reference — unaffected by the paid-plan guard", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919876543210" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-free", isActive: true, price: 0 });
    isPaymentExemptTestAccount.mockReturnValueOnce(false);
    purchaseMembership.mockResolvedValueOnce({ ok: true, membership: { id: "m1" } });

    const res = await POST(request({ planId: "plan-free" }));
    expect(res.status).toBe(200);
    expect(purchaseMembership).toHaveBeenCalledWith("u1", "plan-free");
  });

  it("still activates the Rider test account on a paid plan without a verified payment", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919000000001" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-149", isActive: true, price: 149 });
    isPaymentExemptTestAccount.mockReturnValueOnce(true);
    purchaseMembership.mockResolvedValueOnce({ ok: true, membership: { id: "m1" } });

    const res = await POST(request({ planId: "plan-149" }));
    expect(res.status).toBe(200);
    expect(purchaseMembership).toHaveBeenCalledWith("u1", "plan-149", expect.stringContaining("DUMMY-TEST-ACCOUNT-"), undefined);
  });

  it("rejects a one-time purchase for a real Rider on a paid plan — must use /subscription instead", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919876543210" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-149", isActive: true, price: 149 });
    isPaymentExemptTestAccount.mockReturnValueOnce(false);

    const res = await POST(request({ planId: "plan-149", paymentId: "DUMMY-123" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(expect.objectContaining({ error: "ONE_TIME_PURCHASE_DISABLED" }));
    expect(purchaseMembership).not.toHaveBeenCalled();
  });

  it("rejects even a real signed Razorpay payment reference for a paid plan — one-time purchase is disabled regardless of verification", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919876543210" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-149", isActive: true, price: 149 });
    isPaymentExemptTestAccount.mockReturnValueOnce(false);

    const res = await POST(
      request({
        planId: "plan-149",
        razorpayOrderId: "order_1",
        razorpayPaymentId: "pay_1",
        razorpaySignature: "sig_1",
      }),
    );
    expect(res.status).toBe(403);
    expect(purchaseMembership).not.toHaveBeenCalled();
  });
});
