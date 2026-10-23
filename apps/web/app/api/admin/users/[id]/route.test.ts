/**
 * Transport-layer coverage for admin account deletion — specifically that session-cache
 * invalidation happens BEFORE the delete/anonymize itself (the hard-delete path removes the
 * `Session` rows `invalidateCachedUserSessions` needs to read to find what to clear). This is the
 * fix for the "deleted account's stale session can still resolve" gap — see
 * `invalidateCachedUserSessions`'s doc comment in packages/auth/src/server.ts.
 * `AdminService.deleteUser` itself is mocked out, not re-tested here.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { deleteUser, updateUserRole, updateUserAccountType, refreshCachedUserSessions, invalidateCachedUserSessions } =
  vi.hoisted(() => ({
    deleteUser: vi.fn(),
    updateUserRole: vi.fn(),
    updateUserAccountType: vi.fn(),
    refreshCachedUserSessions: vi.fn(),
    invalidateCachedUserSessions: vi.fn(),
  }));

vi.mock("@bikie/services", () => ({
  AdminService: { deleteUser, updateUserRole, updateUserAccountType },
}));

vi.mock("@bikie/auth", () => ({
  refreshCachedUserSessions,
  invalidateCachedUserSessions,
}));

vi.mock("@/lib/require-role", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  logAdminAction: vi.fn(),
}));

import { DELETE, PATCH } from "./route";
import { requireRole } from "@/lib/require-role";

const mockedRequireRole = requireRole as unknown as ReturnType<typeof vi.fn>;

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("DELETE /api/admin/users/[id]", () => {
  it("invalidates cached sessions before deleting — never after", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    const order: string[] = [];
    invalidateCachedUserSessions.mockImplementationOnce(async () => {
      order.push("invalidate");
    });
    deleteUser.mockImplementationOnce(async () => {
      order.push("delete");
      return { ok: true, anonymized: false };
    });

    const res = await DELETE(new Request("http://localhost"), params("user-1"));

    expect(res.status).toBe(200);
    expect(invalidateCachedUserSessions).toHaveBeenCalledWith("user-1");
    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(order).toEqual(["invalidate", "delete"]);
  });

  it("401s with no session, never touching deletion at all", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await DELETE(new Request("http://localhost"), params("user-1"));

    expect(res.status).toBe(401);
    expect(invalidateCachedUserSessions).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("404s cleanly when the target doesn't exist", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    deleteUser.mockResolvedValueOnce({ ok: false, reason: "NOT_FOUND" });

    const res = await DELETE(new Request("http://localhost"), params("ghost"));

    expect(res.status).toBe(404);
  });

  it("refuses to delete an admin account", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    deleteUser.mockResolvedValueOnce({ ok: false, reason: "ADMIN_PROTECTED" });

    const res = await DELETE(new Request("http://localhost"), params("admin-2"));

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/admin/users/[id] — accountType correctness", () => {
  function patchRequest(body: unknown) {
    return new Request("http://localhost", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("sets the given accountType and refreshes cached sessions so the change is live immediately", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    updateUserAccountType.mockResolvedValueOnce({ id: "user-1", accountType: "SERVICE_PROVIDER" });

    const res = await PATCH(patchRequest({ accountType: "SERVICE_PROVIDER" }), params("user-1"));

    expect(res.status).toBe(200);
    expect(updateUserAccountType).toHaveBeenCalledWith("user-1", "SERVICE_PROVIDER");
    expect(refreshCachedUserSessions).toHaveBeenCalledWith("user-1");
  });

  it("never refreshes sessions when nothing was actually changed", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });

    await PATCH(patchRequest({}), params("user-1"));

    expect(updateUserAccountType).not.toHaveBeenCalled();
    expect(refreshCachedUserSessions).not.toHaveBeenCalled();
  });
});
