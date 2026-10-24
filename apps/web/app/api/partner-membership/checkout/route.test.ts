/**
 * Service Provider membership is monthly-auto-debit-only (no "Pay once" for a real SP) — this
 * route must reject a one-time order for any paid plan except the ADR-089 store-review/QA test
 * account, which still needs the simulated checkout since it can't complete a real Razorpay
 * mandate authorization. `PartnerMembershipService` is mocked; `getPlanById`'s own logic is
 * covered in packages/database/src/repositories/partner-membership.repository.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { getPlanById, isPaymentExemptTestAccount } = vi.hoisted(() => ({
  getPlanById: vi.fn(),
  isPaymentExemptTestAccount: vi.fn(),
}));

vi.mock("@bikie/services", () => ({
  PartnerMembershipService: { getPlanById, isPaymentExemptTestAccount },
}));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { POST } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

function request(body: object) {
  return new Request("http://localhost/api/partner-membership/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/partner-membership/checkout", () => {
  it("still allows a free plan through — unaffected by the paid-plan guard", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919876543210" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-free", isActive: true, price: 0 });
    isPaymentExemptTestAccount.mockReturnValueOnce(false);

    const res = await POST(request({ planId: "plan-free" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ razorpayConfigured: false, free: true });
  });

  it("still allows the ADR-089 test account through for a paid plan", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919000000002" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-99", isActive: true, price: 99 });
    isPaymentExemptTestAccount.mockReturnValueOnce(true);

    const res = await POST(request({ planId: "plan-99" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ razorpayConfigured: false, testAccount: true });
  });

  it("rejects a one-time checkout for a real Service Provider on a paid plan — must use /subscription instead", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919876543210" } }, error: null });
    getPlanById.mockResolvedValueOnce({ id: "plan-99", isActive: true, price: 99 });
    isPaymentExemptTestAccount.mockReturnValueOnce(false);

    const res = await POST(request({ planId: "plan-99" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual(
      expect.objectContaining({ error: "ONE_TIME_CHECKOUT_DISABLED" }),
    );
  });

  it("404s for an unknown or inactive plan before the paid-plan guard even runs", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "u1", phoneNumber: "+919876543210" } }, error: null });
    getPlanById.mockResolvedValueOnce(null);

    const res = await POST(request({ planId: "nope" }));
    expect(res.status).toBe(404);
  });
});
