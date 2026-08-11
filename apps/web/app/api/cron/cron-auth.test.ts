/**
 * Every /api/cron/* route shares the same inline `Authorization: Bearer <CRON_SECRET>` guard —
 * this is the only place that guard is actually exercised by a test. Business logic (escalation
 * ticking, stale-alert resolution, stale-location cleanup, and their idempotency) is covered in
 * packages/services/src/modules/safety-location/safety-location.test.ts; @bikie/services is
 * mocked out here so this file stays focused on authentication, not re-testing that logic.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@bikie/services", () => ({
  RiderLocationService: { autoDisableStaleSharing: vi.fn(async () => 0) },
  SOSService: { autoResolveStaleAlerts: vi.fn(async () => undefined) },
  getSafetyLocationModule: vi.fn(() => ({
    ports: { sosAlerts: { findAlertsDueForEscalation: vi.fn(async () => []) } },
    escalation: { tickEscalation: vi.fn(async () => undefined) },
  })),
}));

import { GET as escalateGET } from "./sos-escalate/route";
import { GET as resolveGET } from "./sos-resolve/route";
import { GET as cleanupGET } from "./rider-location-cleanup/route";

const originalSecret = process.env.CRON_SECRET;

function makeRequest(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/cron/test", { headers });
}

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe.each([
  ["sos-escalate", escalateGET],
  ["sos-resolve", resolveGET],
  ["rider-location-cleanup", cleanupGET],
] as const)("cron route auth — %s", (_name, GET) => {
  it("rejects a request with no Authorization header", async () => {
    process.env.CRON_SECRET = "test-secret";
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("rejects an invalid bearer secret", async () => {
    process.env.CRON_SECRET = "test-secret";
    const res = await GET(makeRequest("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("rejects every request, even with a bearer value, when CRON_SECRET itself is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest("Bearer anything"));
    expect(res.status).toBe(401);
  });

  it("rejects a Rider/Provider/Admin session-style bearer that just happens to be present but wrong", async () => {
    process.env.CRON_SECRET = "test-secret";
    const res = await GET(makeRequest("Bearer some-user-session-token"));
    expect(res.status).toBe(401);
  });

  it("accepts a request with the correct bearer secret", async () => {
    process.env.CRON_SECRET = "test-secret";
    const res = await GET(makeRequest("Bearer test-secret"));
    expect(res.status).toBe(200);
  });
});
