import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  mechanicListingRepository: {},
  mechanicRequestRepository: {},
  partnerRepository: {},
}));

import { createMechanicMarketplaceModule } from "./public";
import type { MechanicMarketplacePorts, MechanicListingRow, MechanicRequestRow, RequestWithContext } from "./ports";

function listing(overrides: Partial<MechanicListingRow> = {}): MechanicListingRow {
  return {
    id: "listing-1",
    partnerId: "partner-1",
    title: "Oil change",
    description: "Full synthetic",
    category: "Maintenance",
    price: 500,
    imageUrls: [],
    latitude: null,
    longitude: null,
    serviceRadiusKm: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function requestRow(overrides: Partial<MechanicRequestRow> = {}): MechanicRequestRow {
  return {
    id: "req-1",
    listingId: "listing-1",
    riderId: "rider-1",
    status: "PENDING",
    quotedPrice: 500,
    message: null,
    latitude: 12.9,
    longitude: 77.6,
    requestedAt: new Date(),
    decidedAt: null,
    completedAt: null,
    ...overrides,
  };
}

function emptyPorts(overrides: Partial<MechanicMarketplacePorts> = {}): MechanicMarketplacePorts {
  return {
    partners: {
      findPartnerByUserId: vi.fn(async () => null),
      findUserIdByPartnerId: vi.fn(async () => null),
    },
    listings: {
      createListing: vi.fn(async (input) => listing(input)),
      updateOwnListing: vi.fn(async () => null),
      deactivateOwnListing: vi.fn(async () => true),
      findOwnListings: vi.fn(async () => []),
      findListingById: vi.fn(async () => null),
      findNearbyActiveListings: vi.fn(async () => []),
    },
    requests: {
      createRequest: vi.fn(async (input) => requestRow(input)),
      findRequestById: vi.fn(async () => null),
      findRequestsForRider: vi.fn(async () => []),
      findRequestsForPartner: vi.fn(async () => []),
      transitionStatus: vi.fn(async () => ({ ok: false, reason: "NOT_FOUND" }) as const),
    },
    notifications: { notify: vi.fn(async () => {}) },
    ...overrides,
  };
}

describe("mechanic-listing.application — Partner authorization", () => {
  it("rejects a non-Partner user", async () => {
    const ports = emptyPorts();
    const { listings } = createMechanicMarketplaceModule(ports);

    const result = await listings.createListing("user-1", {
      title: "x",
      description: "y",
      category: "z",
      price: 1,
      imageUrls: [],
    });

    expect(result).toEqual({ ok: false, reason: "NOT_A_PARTNER" });
    expect(ports.listings.createListing).not.toHaveBeenCalled();
  });

  it("rejects a Partner whose type isn't MECHANIC, even though they're a valid capable Partner", async () => {
    const ports = emptyPorts({
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "partner-1", type: "RENTAL" })),
        findUserIdByPartnerId: vi.fn(async () => null),
      },
    });
    const { listings } = createMechanicMarketplaceModule(ports);

    const result = await listings.createListing("user-1", {
      title: "x",
      description: "y",
      category: "z",
      price: 1,
      imageUrls: [],
    });

    expect(result).toEqual({ ok: false, reason: "WRONG_PARTNER_TYPE" });
  });

  it("creates a listing scoped to the caller's own partnerId, never a client-supplied one", async () => {
    const ports = emptyPorts({
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "partner-1", type: "MECHANIC" })),
        findUserIdByPartnerId: vi.fn(async () => "owner-user-1"),
      },
    });
    const { listings } = createMechanicMarketplaceModule(ports);

    const result = await listings.createListing("user-1", {
      title: "Oil change",
      description: "Full synthetic",
      category: "Maintenance",
      price: 500,
      imageUrls: [],
    });

    expect(result.ok).toBe(true);
    expect(ports.listings.createListing).toHaveBeenCalledWith(
      expect.objectContaining({ partnerId: "partner-1" }),
    );
  });

  it("deactivates rather than deletes — never calls anything resembling a hard delete", async () => {
    const ports = emptyPorts({
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "partner-1", type: "MECHANIC" })),
        findUserIdByPartnerId: vi.fn(async () => null),
      },
    });
    const { listings } = createMechanicMarketplaceModule(ports);

    const result = await listings.deactivateListing("user-1", "listing-1");

    expect(result).toEqual({ ok: true });
    expect(ports.listings.deactivateOwnListing).toHaveBeenCalledWith("listing-1", "partner-1");
  });

  it("discoverListings never exposes a Partner's wrong-ownership listing (scoped entirely by the repository's own partnerId filter, not re-checked here) and getListingDetail hides a deactivated listing from Rider browsing", async () => {
    const ports = emptyPorts({
      listings: {
        createListing: vi.fn(),
        updateOwnListing: vi.fn(),
        deactivateOwnListing: vi.fn(),
        findOwnListings: vi.fn(async () => []),
        findListingById: vi.fn(async () => listing({ isActive: false })),
        findNearbyActiveListings: vi.fn(async () => []),
      },
    });
    const { listings } = createMechanicMarketplaceModule(ports);

    const detail = await listings.getListingDetail("listing-1");
    expect(detail).toBeNull();
  });
});

describe("mechanic-request.application — quoted price snapshot", () => {
  it("captures the listing's price at submission time as quotedPrice", async () => {
    const ports = emptyPorts({
      listings: {
        createListing: vi.fn(),
        updateOwnListing: vi.fn(),
        deactivateOwnListing: vi.fn(),
        findOwnListings: vi.fn(async () => []),
        findListingById: vi.fn(async () => listing({ price: 750 })),
        findNearbyActiveListings: vi.fn(async () => []),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.submitRequest("rider-1", { listingId: "listing-1" });

    expect(result.ok).toBe(true);
    expect(ports.requests.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({ quotedPrice: 750 }),
    );
  });

  it("rejects a request against an inactive listing", async () => {
    const ports = emptyPorts({
      listings: {
        createListing: vi.fn(),
        updateOwnListing: vi.fn(),
        deactivateOwnListing: vi.fn(),
        findOwnListings: vi.fn(async () => []),
        findListingById: vi.fn(async () => listing({ isActive: false })),
        findNearbyActiveListings: vi.fn(async () => []),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.submitRequest("rider-1", { listingId: "listing-1" });

    expect(result).toEqual({ ok: false, reason: "LISTING_INACTIVE" });
    expect(ports.requests.createRequest).not.toHaveBeenCalled();
  });

  it("notifies the listing's owning Partner (resolved via findUserIdByPartnerId, never the raw partnerId)", async () => {
    const ports = emptyPorts({
      listings: {
        createListing: vi.fn(),
        updateOwnListing: vi.fn(),
        deactivateOwnListing: vi.fn(),
        findOwnListings: vi.fn(async () => []),
        findListingById: vi.fn(async () => listing()),
        findNearbyActiveListings: vi.fn(async () => []),
      },
      partners: {
        findPartnerByUserId: vi.fn(async () => null),
        findUserIdByPartnerId: vi.fn(async () => "partner-owner-user"),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    await requests.submitRequest("rider-1", { listingId: "listing-1" });

    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "partner-owner-user",
      "MECHANIC_REQUEST_RECEIVED",
      expect.any(String),
      expect.any(String),
      "MechanicServiceRequest",
      expect.any(String),
    );
  });
});

describe("mechanic-request.application — location visibility", () => {
  function withContext(overrides: Partial<RequestWithContext> = {}): RequestWithContext {
    return {
      ...requestRow(),
      listing: { id: "listing-1", title: "Oil change", partnerId: "partner-1" },
      rider: { id: "rider-1", name: "Rider One" },
      ...overrides,
    };
  }

  it("returns the full row (including location) to the request's own Rider", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext()),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.getRequestDetail("req-1", "rider-1");
    expect(result?.latitude).toBe(12.9);
  });

  it("returns the full row to the owning Partner", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext()),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(),
      },
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "partner-1", type: "MECHANIC" })),
        findUserIdByPartnerId: vi.fn(async () => null),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.getRequestDetail("req-1", "partner-owner-user");
    expect(result?.latitude).toBe(12.9);
  });

  it("returns null (not a redacted row) for an unrelated third party — same as not found", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext()),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(),
      },
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "some-other-partner", type: "MECHANIC" })),
        findUserIdByPartnerId: vi.fn(async () => null),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.getRequestDetail("req-1", "stranger-user");
    expect(result).toBeNull();
  });
});

describe("mechanic-request.application — atomic lifecycle transitions", () => {
  function withContext(overrides: Partial<RequestWithContext> = {}): RequestWithContext {
    return {
      ...requestRow(),
      listing: { id: "listing-1", title: "Oil change", partnerId: "partner-1" },
      rider: { id: "rider-1", name: "Rider One" },
      ...overrides,
    };
  }

  it("a lost CAS race (another call already transitioned it) returns NOT_FOUND and never notifies", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext()),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(async () => ({ ok: false, reason: "NOT_FOUND" }) as const),
      },
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "partner-1", type: "MECHANIC" })),
        findUserIdByPartnerId: vi.fn(async () => "partner-owner-user"),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.transition("partner-owner-user", "req-1", "ACCEPTED");

    expect(result).toEqual({ ok: false, reason: "NOT_FOUND" });
    expect(ports.notifications.notify).not.toHaveBeenCalled();
  });

  it("the Rider cannot accept/reject a request — only the owning Partner can", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext()),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    const result = await requests.transition("rider-1", "req-1", "ACCEPTED");

    expect(result).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(ports.requests.transitionStatus).not.toHaveBeenCalled();
  });

  it("notifies the Rider when the Partner accepts", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext()),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(async () => ({
          ok: true,
          row: requestRow({ status: "ACCEPTED" }),
          listingPartnerId: "partner-1",
          riderId: "rider-1",
          listingTitle: "Oil change",
        }) as const),
      },
      partners: {
        findPartnerByUserId: vi.fn(async () => ({ id: "partner-1", type: "MECHANIC" })),
        findUserIdByPartnerId: vi.fn(async () => null),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    await requests.transition("partner-owner-user", "req-1", "ACCEPTED");

    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "rider-1",
      "MECHANIC_REQUEST_ACCEPTED",
      expect.any(String),
      expect.any(String),
      "MechanicServiceRequest",
      "req-1",
    );
  });

  it("notifies the Partner (resolved to their User.id) when the Rider cancels — not the Partner row id", async () => {
    const ports = emptyPorts({
      requests: {
        createRequest: vi.fn(),
        findRequestById: vi.fn(async () => withContext({ status: "ACCEPTED" })),
        findRequestsForRider: vi.fn(async () => []),
        findRequestsForPartner: vi.fn(async () => []),
        transitionStatus: vi.fn(async () => ({
          ok: true,
          row: requestRow({ status: "CANCELLED" }),
          listingPartnerId: "partner-1",
          riderId: "rider-1",
          listingTitle: "Oil change",
        }) as const),
      },
      partners: {
        findPartnerByUserId: vi.fn(async () => null),
        findUserIdByPartnerId: vi.fn(async (partnerId) => (partnerId === "partner-1" ? "partner-owner-user" : null)),
      },
    });
    const { requests } = createMechanicMarketplaceModule(ports);

    await requests.transition("rider-1", "req-1", "CANCELLED");

    expect(ports.notifications.notify).toHaveBeenCalledWith(
      "partner-owner-user",
      "MECHANIC_REQUEST_STATUS_CHANGED",
      expect.any(String),
      expect.any(String),
      "MechanicServiceRequest",
      "req-1",
    );
  });
});
