/**
 * Transport coverage for the Rider self-service subscription cancellation endpoint.
 * `MembershipService.cancelSubscription`'s own logic is covered in
 * packages/services/src/membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { cancelSubscription } = vi.hoisted(() => ({ cancelSubscription: vi.fn() }));

vi.mock("@bikie/services", () => ({ MembershipService: { cancelSubscription } }));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { POST } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

describe("POST /api/membership/subscription/cancel", () => {
  it("401s without a session and never touches the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(cancelSubscription).not.toHaveBeenCalled();
  });

  it("404s when the Rider has no active subscription", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    cancelSubscription.mockResolvedValueOnce({ ok: false, reason: "NO_ACTIVE_SUBSCRIPTION" });

    const res = await POST();
    expect(res.status).toBe(404);
  });

  it("503s when Razorpay doesn't confirm the cancellation", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    cancelSubscription.mockResolvedValueOnce({ ok: false, reason: "CANCEL_FAILED" });

    const res = await POST();
    expect(res.status).toBe(503);
  });

  it("on success, scopes the cancellation to the authenticated user and returns the updated membership", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    cancelSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "um-1", endDate: "2027-10-26T00:00:00.000Z" } });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(cancelSubscription).toHaveBeenCalledWith("user-1");
    expect(body).toEqual({ membership: { id: "um-1", endDate: "2027-10-26T00:00:00.000Z" } });
  });
});
