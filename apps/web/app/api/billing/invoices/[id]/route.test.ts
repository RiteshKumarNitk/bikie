/**
 * ADR-070 — transport coverage for the per-invoice endpoint: auth gating and the
 * "another user's id is a 404, not a 403" rule. `BillingService.getInvoice` (which resolves
 * ownership) is mocked; its own logic is covered in
 * packages/database/src/repositories/billing.repository.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { getInvoice } = vi.hoisted(() => ({ getInvoice: vi.fn() }));

vi.mock("@bikie/services", () => ({ BillingService: { getInvoice } }));
vi.mock("@/lib/require-role", () => ({ requireSession: vi.fn() }));

import { GET } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

afterEach(() => vi.clearAllMocks());

describe("GET /api/billing/invoices/[id]", () => {
  it("401s without a session and never touches the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET(new Request("http://localhost/api/billing/invoices/inv-1"), params("inv-1"));
    expect(res.status).toBe(401);
    expect(getInvoice).not.toHaveBeenCalled();
  });

  it("passes the session user id (never a client value) to the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    getInvoice.mockResolvedValueOnce({ id: "inv-1", receiptNo: "BIKIE-2026-000001" });

    const res = await GET(new Request("http://localhost/api/billing/invoices/inv-1"), params("inv-1"));
    const body = await res.json();

    expect(getInvoice).toHaveBeenCalledWith("user-1", "inv-1");
    expect(body).toEqual({ invoice: { id: "inv-1", receiptNo: "BIKIE-2026-000001" } });
  });

  it("404s (not 403) when the invoice is not the caller's — service returns null for both not-found and not-owner", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    getInvoice.mockResolvedValueOnce(null);

    const res = await GET(new Request("http://localhost/api/billing/invoices/someone-elses"), params("someone-elses"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "NOT_FOUND" });
  });
});
