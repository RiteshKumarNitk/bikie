import { afterEach, describe, expect, it, vi } from "vitest";

const sosAlertResponse = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("../client", () => ({ prisma: { sOSAlertResponse: sosAlertResponse } }));
vi.mock("../generated/prisma/client.js", () => ({
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
}));

import { createOffer, declineAlert } from "./sos-session.repository";

afterEach(() => vi.clearAllMocks());

/**
 * Regression coverage for a production crash: `session.application.ts`'s `offerHelp` reads
 * `offer.responder.name` to build the reporter's notification, and the `SosOfferRow` port type
 * (packages/services/.../ports/index.ts) promises `responder` is always populated. The actual
 * `prisma.sOSAlertResponse.create` call here never included that relation, so `offer.responder`
 * was `undefined` on every real call — masked at compile time only because the adapter wired this
 * through an `as any` cast (now removed). This test fails immediately if the `include` clause
 * ever gets dropped again, without needing a real database.
 */
describe("sos-session.repository — responder relation (regression)", () => {
  it("createOffer includes the responder relation prisma must fetch for offerHelp's notification", async () => {
    sosAlertResponse.create.mockResolvedValueOnce({
      id: "offer-1",
      alertId: "alert-1",
      responderId: "helper-1",
      responder: { id: "helper-1", name: "Helper One", phone: "9000000000", email: "h@example.com" },
      status: "OFFERED",
      distanceMeters: null,
      etaMinutes: null,
      message: null,
      createdAt: new Date(),
    });

    const result = await createOffer({ alertId: "alert-1", responderId: "helper-1" });

    const callArg = sosAlertResponse.create.mock.calls[0][0] as { include?: unknown };
    expect(callArg.include).toEqual({
      responder: { select: { id: true, name: true, phone: true, email: true } },
    });
    // The exact access pattern offerHelp uses — this throws a TypeError if responder is undefined.
    expect(result.responder.name).toBe("Helper One");
  });

  it("declineAlert also includes the responder relation, matching the SosOfferRow contract", async () => {
    sosAlertResponse.create.mockResolvedValueOnce({
      id: "offer-2",
      alertId: "alert-1",
      responderId: "helper-2",
      responder: { id: "helper-2", name: "Helper Two", phone: null, email: "h2@example.com" },
      status: "DECLINED",
      distanceMeters: null,
      etaMinutes: null,
      message: null,
      createdAt: new Date(),
    });

    const result = await declineAlert({ alertId: "alert-1", responderId: "helper-2" });

    const callArg = sosAlertResponse.create.mock.calls[0][0] as { include?: unknown };
    expect(callArg.include).toEqual({
      responder: { select: { id: true, name: true, phone: true, email: true } },
    });
    expect(result.responder.name).toBe("Helper Two");
  });
});
