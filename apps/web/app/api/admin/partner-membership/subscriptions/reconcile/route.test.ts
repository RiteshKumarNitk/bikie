/**
 * Transport coverage for the admin webhook-recovery endpoint: auth gating, request validation,
 * and that a successful reconcile is audit-logged. `PartnerMembershipService.reconcileSubscription`'s
 * own logic is covered in packages/services/src/partner-membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { reconcileSubscription } = vi.hoisted(() => ({ reconcileSubscription: vi.fn() }));
const { logAdminAction } = vi.hoisted(() => ({ logAdminAction: vi.fn() }));

vi.mock("@bikie/services", () => ({ PartnerMembershipService: { reconcileSubscription } }));
vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAdminAction }));

import { POST } from "./route";
import { requireRole } from "@/lib/require-role";

const mockedRequireRole = requireRole as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

function request(body: object) {
  return new Request("http://localhost/api/admin/partner-membership/subscriptions/reconcile", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/partner-membership/subscriptions/reconcile", () => {
  it("401s without an admin session and never touches the service", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));

    expect(res.status).toBe(401);
    expect(reconcileSubscription).not.toHaveBeenCalled();
  });

  it("400s on a missing razorpaySubscriptionId", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });

    const res = await POST(request({}));

    expect(res.status).toBe(400);
    expect(reconcileSubscription).not.toHaveBeenCalled();
  });

  it("404s for an unknown subscription id", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    reconcileSubscription.mockResolvedValueOnce({ ok: false, reason: "NOT_FOUND" });

    const res = await POST(request({ razorpaySubscriptionId: "sub_unknown" }));

    expect(res.status).toBe(404);
  });

  it("503s when Razorpay's live state could not be verified", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    reconcileSubscription.mockResolvedValueOnce({ ok: false, reason: "COULD_NOT_VERIFY" });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));

    expect(res.status).toBe(503);
  });

  it("on success, returns the updated membership and audit-logs the admin action with the subscription id", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    reconcileSubscription.mockResolvedValueOnce({
      ok: true,
      membership: { id: "pm-1", endDate: "2026-11-25T00:00:00.000Z" },
      invoicesFound: 2,
    });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ membership: { id: "pm-1", endDate: "2026-11-25T00:00:00.000Z" }, invoicesFound: 2 });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        action: "RECONCILE_PARTNER_SUBSCRIPTION",
        entityId: "pm-1",
        metadata: { razorpaySubscriptionId: "sub_abc123", invoicesFound: 2 },
      }),
    );
  });
});
