/**
 * Transport coverage for the admin webhook-recovery endpoint: auth gating, request validation,
 * that it's routed to the correct service by account type, and that a successful reconcile is
 * audit-logged. `MembershipService`/`PartnerMembershipService`'s own `reconcileSubscription`
 * logic is covered in their respective *.service.test.ts files; `SubscriptionWebhookRouter`'s
 * own resolution logic is covered in subscription-webhook-router.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { riderReconcileSubscription, partnerReconcileSubscription, resolveAccountType } = vi.hoisted(() => ({
  riderReconcileSubscription: vi.fn(),
  partnerReconcileSubscription: vi.fn(),
  resolveAccountType: vi.fn(),
}));
const { logAdminAction } = vi.hoisted(() => ({ logAdminAction: vi.fn() }));

vi.mock("@bikie/services", () => ({
  MembershipService: { reconcileSubscription: riderReconcileSubscription },
  PartnerMembershipService: { reconcileSubscription: partnerReconcileSubscription },
  SubscriptionWebhookRouter: { resolveAccountType },
}));
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
  it("401s without an admin session and never resolves the account type", async () => {
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

  it("404s when the subscription id matches neither account type", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce(null);

    const res = await POST(request({ razorpaySubscriptionId: "sub_unknown" }));

    expect(res.status).toBe(404);
    expect(riderReconcileSubscription).not.toHaveBeenCalled();
    expect(partnerReconcileSubscription).not.toHaveBeenCalled();
  });

  it("routes a SERVICE_PROVIDER subscription id to PartnerMembershipService, never MembershipService", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("SERVICE_PROVIDER");
    partnerReconcileSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "pm-1" }, invoicesFound: 1 });

    const res = await POST(request({ razorpaySubscriptionId: "sub_abc123" }));

    expect(res.status).toBe(200);
    expect(partnerReconcileSubscription).toHaveBeenCalledWith("sub_abc123");
    expect(riderReconcileSubscription).not.toHaveBeenCalled();
  });

  it("routes a RIDER subscription id to MembershipService, never PartnerMembershipService", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("RIDER");
    riderReconcileSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "um-1" }, invoicesFound: 2 });

    const res = await POST(request({ razorpaySubscriptionId: "sub_rider1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(riderReconcileSubscription).toHaveBeenCalledWith("sub_rider1");
    expect(partnerReconcileSubscription).not.toHaveBeenCalled();
    expect(body).toEqual({ membership: { id: "um-1" }, invoicesFound: 2, accountType: "RIDER" });
  });

  it("503s when Razorpay's live state could not be verified", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("RIDER");
    riderReconcileSubscription.mockResolvedValueOnce({ ok: false, reason: "COULD_NOT_VERIFY" });

    const res = await POST(request({ razorpaySubscriptionId: "sub_rider1" }));

    expect(res.status).toBe(503);
  });

  it("on success, audit-logs the admin action with the account type and entity", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    resolveAccountType.mockResolvedValueOnce("RIDER");
    riderReconcileSubscription.mockResolvedValueOnce({ ok: true, membership: { id: "um-1" }, invoicesFound: 2 });

    await POST(request({ razorpaySubscriptionId: "sub_rider1" }));

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        action: "RECONCILE_SUBSCRIPTION",
        entity: "UserMembership",
        entityId: "um-1",
        metadata: { razorpaySubscriptionId: "sub_rider1", invoicesFound: 2, accountType: "RIDER" },
      }),
    );
  });
});
