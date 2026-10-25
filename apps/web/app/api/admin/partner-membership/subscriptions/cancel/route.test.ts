/**
 * Transport coverage for admin-triggered subscription cancellation: auth gating, request
 * validation, and that a successful cancel is audit-logged. `PartnerMembershipService.
 * adminCancelSubscription`'s own logic is covered in
 * packages/services/src/partner-membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { adminCancelSubscription } = vi.hoisted(() => ({ adminCancelSubscription: vi.fn() }));
const { logAdminAction } = vi.hoisted(() => ({ logAdminAction: vi.fn() }));

vi.mock("@bikie/services", () => ({ PartnerMembershipService: { adminCancelSubscription } }));
vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAdminAction }));

import { POST } from "./route";
import { requireRole } from "@/lib/require-role";

const mockedRequireRole = requireRole as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

function request(body: object) {
  return new Request("http://localhost/api/admin/partner-membership/subscriptions/cancel", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/partner-membership/subscriptions/cancel", () => {
  it("401s without an admin session and never touches the service", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));

    expect(res.status).toBe(401);
    expect(adminCancelSubscription).not.toHaveBeenCalled();
  });

  it("400s on a missing razorpaySubscriptionId", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });

    const res = await POST(request({}));

    expect(res.status).toBe(400);
    expect(adminCancelSubscription).not.toHaveBeenCalled();
  });

  it("404s for an unknown subscription id", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    adminCancelSubscription.mockResolvedValueOnce({ ok: false, reason: "NOT_FOUND" });

    const res = await POST(request({ razorpaySubscriptionId: "sub_unknown" }));

    expect(res.status).toBe(404);
  });

  it("503s when Razorpay doesn't confirm the cancellation", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    adminCancelSubscription.mockResolvedValueOnce({ ok: false, reason: "CANCEL_FAILED" });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));

    expect(res.status).toBe(503);
  });

  it("on success, returns the updated membership and audit-logs the admin action", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    adminCancelSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "pm-1", endDate: "2026-11-25T00:00:00.000Z" } });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ membership: { id: "pm-1", endDate: "2026-11-25T00:00:00.000Z" } });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        action: "CANCEL_PARTNER_SUBSCRIPTION",
        entityId: "pm-1",
        metadata: { razorpaySubscriptionId: "sub_abc123" },
      }),
    );
  });
});
