/**
 * `pendingSubscription` is only checked (and the service call only made) when `membership` is
 * `null` — a subscription that's been created but not yet webhook-confirmed charged, so the
 * Rider can see "payment pending" instead of nothing happening.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { getActiveMembership, getPendingSubscription } = vi.hoisted(() => ({
  getActiveMembership: vi.fn(),
  getPendingSubscription: vi.fn(),
}));

vi.mock("@bikie/services", () => ({ MembershipService: { getActiveMembership, getPendingSubscription } }));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { GET } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

describe("GET /api/membership/active", () => {
  it("401s without a session and never calls either service function", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(getActiveMembership).not.toHaveBeenCalled();
    expect(getPendingSubscription).not.toHaveBeenCalled();
  });

  it("returns the active membership and never checks for a pending one when one is already active", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    getActiveMembership.mockResolvedValueOnce({ id: "um-1", status: "ACTIVE" });

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ membership: { id: "um-1", status: "ACTIVE" }, pendingSubscription: null });
    expect(getPendingSubscription).not.toHaveBeenCalled();
  });

  it("checks for a pending subscription only when there is no active membership", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    getActiveMembership.mockResolvedValueOnce(null);
    getPendingSubscription.mockResolvedValueOnce({ id: "um-2", subscriptionStatus: "created" });

    const res = await GET();
    const body = await res.json();

    expect(getPendingSubscription).toHaveBeenCalledWith("user-1");
    expect(body).toEqual({ membership: null, pendingSubscription: { id: "um-2", subscriptionStatus: "created" } });
  });

  it("returns both null when there's no membership and nothing pending", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    getActiveMembership.mockResolvedValueOnce(null);
    getPendingSubscription.mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(body).toEqual({ membership: null, pendingSubscription: null });
  });
});
