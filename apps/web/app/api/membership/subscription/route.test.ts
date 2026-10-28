/**
 * Transport coverage for the Rider recurring-subscription start endpoint: auth gating, request
 * validation, and that each service result maps to the right status + a real message (not the
 * raw error code). `MembershipService.startSubscription`'s own logic is covered in
 * packages/services/src/membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { startSubscription } = vi.hoisted(() => ({ startSubscription: vi.fn() }));

vi.mock("@bikie/services", () => ({ MembershipService: { startSubscription } }));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { POST } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

function request(body: object) {
  return new Request("http://localhost/api/membership/subscription", { method: "POST", body: JSON.stringify(body) });
}

describe("POST /api/membership/subscription", () => {
  it("401s without a session and never touches the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST(request({ planId: "rider-yearly-plan" }));

    expect(res.status).toBe(401);
    expect(startSubscription).not.toHaveBeenCalled();
  });

  it("400s on a missing planId", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });

    const res = await POST(request({}));

    expect(res.status).toBe(400);
    expect(startSubscription).not.toHaveBeenCalled();
  });

  it("on success, creates the subscription and returns the Razorpay hosted authorization URL", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    startSubscription.mockResolvedValueOnce({
      ok: true,
      membership: { id: "um-1" },
      subscription: { id: "sub_rider123", status: "created", shortUrl: "https://rzp.io/i/rider123" },
    });

    const res = await POST(request({ planId: "rider-yearly-plan" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(startSubscription).toHaveBeenCalledWith("user-1", "rider-yearly-plan");
    expect(body.subscription.shortUrl).toBe("https://rzp.io/i/rider123");
  });

  it.each([
    ["PLAN_NOT_FOUND", 404],
    ["ALREADY_ACTIVE", 409],
    ["SUBSCRIPTION_ALREADY_EXISTS", 409],
    ["SUBSCRIPTION_AUTHORIZATION_IN_PROGRESS", 409],
    ["NOT_CONFIGURED", 503],
    ["SUBSCRIPTION_CREATE_FAILED", 503],
  ])("maps %s to HTTP %i with a real message, never the bare error code", async (reason, status) => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    startSubscription.mockResolvedValueOnce({ ok: false, reason });

    const res = await POST(request({ planId: "rider-yearly-plan" }));
    const body = await res.json();

    expect(res.status).toBe(status);
    expect(body.error).toBe(reason);
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });
});
