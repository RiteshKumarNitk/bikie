/**
 * Transport coverage for the Service Provider in-app Checkout confirmation endpoint: auth, rate limiting,
 * validation, and result mapping. `PartnerMembershipService.confirmCheckoutPayment`'s own logic (owner
 * check, server-side signature verification, Razorpay reconcile) is covered in
 * packages/services/src/partner-membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { confirmCheckoutPayment } = vi.hoisted(() => ({ confirmCheckoutPayment: vi.fn() }));

vi.mock("@bikie/services", () => ({ PartnerMembershipService: { confirmCheckoutPayment } }));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ enforceRateLimit: vi.fn(async () => null) }));

import { POST } from "./route";
import { requireSession } from "@/lib/require-role";
import { enforceRateLimit } from "@/lib/rate-limit";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;
const mockedRateLimit = enforceRateLimit as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.clearAllMocks());

const valid = {
  razorpayPaymentId: "pay_1",
  razorpaySubscriptionId: "sub_sp123",
  razorpaySignature: "a".repeat(64),
};

function request(body: object) {
  return new Request("http://localhost/api/partner-membership/subscription/verify", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/partner-membership/subscription/verify", () => {
  it("401s without a session and never touches the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST(request(valid));

    expect(res.status).toBe(401);
    expect(confirmCheckoutPayment).not.toHaveBeenCalled();
  });

  it("is rate limited per user", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    mockedRateLimit.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Too many requests." }), { status: 429 }));

    const res = await POST(request(valid));

    expect(res.status).toBe(429);
    expect(mockedRateLimit).toHaveBeenCalledWith("partner-membership-checkout-verify", "user-1", expect.any(Object));
    expect(confirmCheckoutPayment).not.toHaveBeenCalled();
  });

  it("400s on a malformed signature without calling the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });

    const res = await POST(request({ ...valid, razorpaySignature: "not-a-signature" }));

    expect(res.status).toBe(400);
    expect(confirmCheckoutPayment).not.toHaveBeenCalled();
  });

  it("returns the membership and whether Razorpay has confirmed the charge", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    confirmCheckoutPayment.mockResolvedValueOnce({ ok: true, membership: { id: "um-1", status: "ACTIVE" }, active: true });

    const res = await POST(request(valid));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(confirmCheckoutPayment).toHaveBeenCalledWith("user-1", valid);
    expect(body).toEqual({ membership: { id: "um-1", status: "ACTIVE" }, active: true });
  });

  it.each([
    ["NOT_FOUND", 404],
    ["INVALID_SIGNATURE", 400],
    ["COULD_NOT_VERIFY", 503],
  ])("maps %s to HTTP %i with a readable message", async (reason, status) => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    confirmCheckoutPayment.mockResolvedValueOnce({ ok: false, reason });

    const res = await POST(request(valid));
    const body = await res.json();

    expect(res.status).toBe(status);
    expect(body.error).toBe(reason);
    expect(body.message).toEqual(expect.any(String));
    expect(body.message).not.toBe(reason);
  });
});
