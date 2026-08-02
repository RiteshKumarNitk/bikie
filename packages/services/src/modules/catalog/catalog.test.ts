import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  bikeRepository: {},
  bookingRepository: {},
  reviewRepository: {},
  wishlistRepository: {},
  destinationRepository: {},
  categoryRepository: {},
  testimonialRepository: {},
  partnerRepository: {},
}));

import {
  DEFAULT_BIKE_SEARCH_PAGE,
  DEFAULT_BIKE_SEARCH_PAGE_SIZE,
  createCatalogModule,
} from "./public";

describe("catalog search defaults", () => {
  it("applies page=1 and pageSize=12 when omitted", async () => {
    const search = vi.fn(async () => ({ bikes: [], total: 0 }));
    const module = createCatalogModule({
      bikes: {
        findFeatured: vi.fn(async () => []),
        search,
        findBySlug: vi.fn(async () => null),
        findByOwner: vi.fn(async () => []),
      },
      destinations: {
        findPopular: vi.fn(async () => []),
        findAll: vi.fn(async () => []),
        findBySlug: vi.fn(async () => null),
      },
      categories: { findAll: vi.fn(async () => []) },
      testimonials: { findFeatured: vi.fn(async () => []) },
    });

    const result = await module.bikes.search({});
    expect(search).toHaveBeenCalledWith({
      page: DEFAULT_BIKE_SEARCH_PAGE,
      pageSize: DEFAULT_BIKE_SEARCH_PAGE_SIZE,
    });
    expect(result).toEqual({ bikes: [], total: 0, page: 1, pageSize: 12 });
  });

  it("preserves explicit pagination", async () => {
    const search = vi.fn(async () => ({ bikes: [{ id: "b1" } as never], total: 40 }));
    const module = createCatalogModule({
      bikes: {
        findFeatured: vi.fn(async () => []),
        search,
        findBySlug: vi.fn(async () => null),
        findByOwner: vi.fn(async () => []),
      },
      destinations: {
        findPopular: vi.fn(async () => []),
        findAll: vi.fn(async () => []),
        findBySlug: vi.fn(async () => null),
      },
      categories: { findAll: vi.fn(async () => []) },
      testimonials: { findFeatured: vi.fn(async () => []) },
    });

    const result = await module.bikes.search({ page: 3, pageSize: 24 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(24);
    expect(result.total).toBe(40);
  });
});
