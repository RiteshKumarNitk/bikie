/**
 * ADR-053 — transport-layer coverage for the user-facing "Account Type Request" endpoint:
 * auth gating and status-code mapping. `AccountTypeRequestService` itself (SAME_TYPE/
 * ALREADY_OPEN/success logic) is covered in packages/services/src/account-type-request.service.test.ts;
 * mocked out here so this file stays focused on the route, not re-testing that logic.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { submitRequest, getMine } = vi.hoisted(() => ({
  submitRequest: vi.fn(),
  getMine: vi.fn(),
}));

vi.mock("@bikie/services", () => ({
  AccountTypeRequestService: { submitRequest, getMine },
}));

vi.mock("@/lib/require-role", () => ({
  requireSession: vi.fn(),
}));

import { GET, POST } from "./route";
import { requireSession } from "@/lib/require-role";

const mockedRequireSession = requireSession as unknown as ReturnType<typeof vi.fn>;

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/account-type-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/account-type-requests", () => {
  it("401s when there is no session", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(getMine).not.toHaveBeenCalled();
  });

  it("returns the caller's own requests", async () => {
    mockedRequireSession.mockResolvedValueOnce({ session: { user: { id: "user-1" } }, error: null });
    getMine.mockResolvedValueOnce([{ id: "request-1" }]);

    const res = await GET();
    const body = await res.json();

    expect(getMine).toHaveBeenCalledWith("user-1");
    expect(body).toEqual({ requests: [{ id: "request-1" }] });
  });
});

describe("POST /api/account-type-requests", () => {
  it("401s when there is no session, without touching the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await POST(jsonRequest({ requestedType: "SERVICE_PROVIDER", reason: "x" }));
    expect(res.status).toBe(401);
    expect(submitRequest).not.toHaveBeenCalled();
  });

  it("400s on invalid input before calling the service", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: { user: { id: "user-1", accountType: "RIDER" } },
      error: null,
    });

    const res = await POST(jsonRequest({ requestedType: "SERVICE_PROVIDER", reason: "" }));
    expect(res.status).toBe(400);
    expect(submitRequest).not.toHaveBeenCalled();
  });

  it("409s when the service reports an already-open request", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: { user: { id: "user-1", accountType: "RIDER" } },
      error: null,
    });
    submitRequest.mockResolvedValueOnce({ ok: false, reason: "ALREADY_OPEN" });

    const res = await POST(jsonRequest({ requestedType: "SERVICE_PROVIDER", reason: "I am a mechanic" }));
    expect(res.status).toBe(409);
  });

  it("creates the request and passes the session's real accountType as currentType", async () => {
    mockedRequireSession.mockResolvedValueOnce({
      session: { user: { id: "user-1", accountType: "RIDER" } },
      error: null,
    });
    submitRequest.mockResolvedValueOnce({ ok: true, request: { id: "new-request" } });

    const res = await POST(jsonRequest({ requestedType: "SERVICE_PROVIDER", reason: "I am a mechanic" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ request: { id: "new-request" } });
    expect(submitRequest).toHaveBeenCalledWith({
      userId: "user-1",
      currentType: "RIDER",
      requestedType: "SERVICE_PROVIDER",
      reason: "I am a mechanic",
      supportingInfo: undefined,
    });
  });
});
