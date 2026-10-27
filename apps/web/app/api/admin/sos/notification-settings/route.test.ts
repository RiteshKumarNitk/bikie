/**
 * Transport coverage for the admin SOS notification-channel toggle: auth gating, request
 * validation, and that a successful update is audit-logged. The actual settings read/write logic
 * is covered by SOSService's own delegation to the safety-location module's port.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { getNotificationSettings, updateNotificationSettings } = vi.hoisted(() => ({
  getNotificationSettings: vi.fn(),
  updateNotificationSettings: vi.fn(),
}));
const { logAdminAction } = vi.hoisted(() => ({ logAdminAction: vi.fn() }));

vi.mock("@bikie/services", () => ({
  SOSService: { getNotificationSettings, updateNotificationSettings },
}));
vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAdminAction }));

import { GET, PATCH } from "./route";
import { requireRole } from "@/lib/require-role";

const mockedRequireRole = requireRole as unknown as ReturnType<typeof vi.fn>;

afterEach(() => vi.resetAllMocks());

function patchRequest(body: object) {
  return new Request("http://localhost/api/admin/sos/notification-settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const sampleSettings = { pushEnabled: true, smsEnabled: true, updatedAt: new Date(), updatedByAdminId: null };

describe("GET /api/admin/sos/notification-settings", () => {
  it("401s without an admin session", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(getNotificationSettings).not.toHaveBeenCalled();
  });

  it("returns the current settings for an admin", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    getNotificationSettings.mockResolvedValueOnce(sampleSettings);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings).toEqual({ ...sampleSettings, updatedAt: sampleSettings.updatedAt.toISOString() });
  });
});

describe("PATCH /api/admin/sos/notification-settings", () => {
  it("401s without an admin session and never writes", async () => {
    mockedRequireRole.mockResolvedValueOnce({
      session: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await PATCH(patchRequest({ pushEnabled: false }));

    expect(res.status).toBe(401);
    expect(updateNotificationSettings).not.toHaveBeenCalled();
  });

  it("400s on an empty body", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });

    const res = await PATCH(patchRequest({}));

    expect(res.status).toBe(400);
    expect(updateNotificationSettings).not.toHaveBeenCalled();
  });

  it("updates settings and audit-logs the change, scoped to the admin's id", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    updateNotificationSettings.mockResolvedValueOnce({ ...sampleSettings, pushEnabled: false, updatedByAdminId: "admin-1" });

    const res = await PATCH(patchRequest({ pushEnabled: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings.pushEnabled).toBe(false);
    expect(updateNotificationSettings).toHaveBeenCalledWith({ pushEnabled: false }, "admin-1");
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        action: "UPDATE_SOS_NOTIFICATION_SETTINGS",
        entity: "SosNotificationSettings",
        metadata: { pushEnabled: false },
      }),
    );
  });

  it("accepts smsEnabled alone", async () => {
    mockedRequireRole.mockResolvedValueOnce({ session: { user: { id: "admin-1" } }, error: null });
    updateNotificationSettings.mockResolvedValueOnce({ ...sampleSettings, smsEnabled: false });

    const res = await PATCH(patchRequest({ smsEnabled: false }));

    expect(res.status).toBe(200);
    expect(updateNotificationSettings).toHaveBeenCalledWith({ smsEnabled: false }, "admin-1");
  });
});
