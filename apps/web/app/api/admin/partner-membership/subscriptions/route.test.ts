/**
 * Transport coverage for the admin "who's subscribed" listing: auth gating, and that it returns
 * exactly what the service gives it. `PartnerMembershipService.listAllSubscriptions`'s own logic
 * is covered in packages/services/src/partner-membership.service.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { listAllSubscriptions } = vi.hoisted(() => ({ listAllSubscriptions: vi.fn() }));

vi.mock("@bikie/services", () => ({ PartnerMembershipService: { listAllSubscriptions } }));
vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn() }));

import { GET } from "./route";
import { requireRole } from "@/lib/require-role";

const mockedRequireRole = requireRole as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

describe("GET /api/admin/partner-membership/subscriptions", () => {
  it("401s without an admin session and never touches the service", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(listAllSubscriptions).not.toHaveBeenCalled();
  });

  it("returns the service's list unmodified", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    const rows = [{ id: "pm-1", userName: "Ravi Kumar" }];
    listAllSubscriptions.mockResolvedValueOnce(rows);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ subscriptions: rows });
  });
});
