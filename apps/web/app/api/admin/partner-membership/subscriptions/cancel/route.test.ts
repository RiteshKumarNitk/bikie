/**
 * Transport coverage for admin-triggered subscription cancellation: auth gating, request
 * validation, routing to the correct service by account type, and that a successful cancel is
 * audit-logged. Each service's own `adminCancelSubscription` logic is covered in their
 * respective *.service.test.ts files.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { riderAdminCancelSubscription, partnerAdminCancelSubscription, resolveAccountType } = vi.hoisted(() => ({
  riderAdminCancelSubscription: vi.fn(),
  partnerAdminCancelSubscription: vi.fn(),
  resolveAccountType: vi.fn(),
}));
const { logAdminAction } = vi.hoisted(() => ({ logAdminAction: vi.fn() }));

vi.mock("@bikie/services", () => ({
  MembershipService: { adminCancelSubscription: riderAdminCancelSubscription },
  PartnerMembershipService: { adminCancelSubscription: partnerAdminCancelSubscription },
  SubscriptionWebhookRouter: { resolveAccountType },
}));
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
    expect(resolveAccountType).not.toHaveBeenCalled();
  });

  it("400s on a missing razorpaySubscriptionId", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });

    const res = await POST(request({}));

    expect(res.status).toBe(400);
    expect(resolveAccountType).not.toHaveBeenCalled();
  });

  it("404s for an unknown subscription id", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce(null);

    const res = await POST(request({ razorpaySubscriptionId: "sub_unknown" }));

    expect(res.status).toBe(404);
  });

  it("routes a SERVICE_PROVIDER subscription id to PartnerMembershipService, never MembershipService", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("SERVICE_PROVIDER");
    partnerAdminCancelSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "pm-1" } });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));

    expect(res.status).toBe(200);
    expect(partnerAdminCancelSubscription).toHaveBeenCalledWith("sub_abc123");
    expect(riderAdminCancelSubscription).not.toHaveBeenCalled();
  });

  it("routes a RIDER subscription id to MembershipService, never PartnerMembershipService", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("RIDER");
    riderAdminCancelSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "um-1" } });

    const res = await POST(request({ razorpaySubscriptionId: "sub_rider1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(riderAdminCancelSubscription).toHaveBeenCalledWith("sub_rider1");
    expect(partnerAdminCancelSubscription).not.toHaveBeenCalled();
    expect(body).toEqual({ membership: { id: "um-1" }, accountType: "RIDER" });
  });

  it("503s when Razorpay doesn't confirm the cancellation", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("RIDER");
    riderAdminCancelSubscription.mockResolvedValueOnce({ ok: false, reason: "CANCEL_FAILED" });

    const res = await POST(request({ razorpaySubscriptionId: "sub_rider1" }));

    expect(res.status).toBe(503);
  });

  it("on success, audit-logs the admin action with the account type and entity", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("RIDER");
    riderAdminCancelSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "um-1" } });

    await POST(request({ razorpaySubscriptionId: "sub_rider1" }));

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        action: "CANCEL_SUBSCRIPTION",
        entity: "UserMembership",
        entityId: "um-1",
        metadata: { razorpaySubscriptionId: "sub_rider1", accountType: "RIDER" },
      }),
    );
  });
});
