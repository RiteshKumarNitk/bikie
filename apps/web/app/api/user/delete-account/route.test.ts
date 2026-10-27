/**
 * Transport coverage for self-service account deletion: auth gating, session-cache invalidation,
 * and status mapping for each blocked reason. `AccountService.deleteOwnAccount`'s own
 * subscription-verification logic is covered in packages/services/src/account.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { deleteOwnAccount } = vi.hoisted(() => ({ deleteOwnAccount: vi.fn() }));
const { invalidateCachedUserSessions } = vi.hoisted(() => ({ invalidateCachedUserSessions: vi.fn() }));

vi.mock("@bikie/services", () => ({ AccountService: { deleteOwnAccount } }));
vi.mock("@bikie/auth", () => ({ invalidateCachedUserSessions }));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { POST } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

describe("POST /api/user/delete-account", () => {
  it("401s without a session and never touches the deletion or cache invalidation", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(deleteOwnAccount).not.toHaveBeenCalled();
    expect(invalidateCachedUserSessions).not.toHaveBeenCalled();
  });

  it("deletes the caller's own account — never a client-supplied id", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    deleteOwnAccount.mockResolvedValueOnce({ ok: true, anonymized: false });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, anonymized: false });
    expect(invalidateCachedUserSessions).toHaveBeenCalledWith("user-1");
    expect(deleteOwnAccount).toHaveBeenCalledWith("user-1");
  });

  it("409s with a clear message when an active subscription blocks deletion", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    deleteOwnAccount.mockResolvedValueOnce({ ok: false, reason: "ACTIVE_SUBSCRIPTION" });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("ACTIVE_SUBSCRIPTION");
    expect(body.message).toMatch(/cancel auto-renewal first/i);
  });

  it("503s when Razorpay's live subscription state couldn't be verified", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    deleteOwnAccount.mockResolvedValueOnce({ ok: false, reason: "COULD_NOT_VERIFY_SUBSCRIPTION" });

    const res = await POST();

    expect(res.status).toBe(503);
  });
});
