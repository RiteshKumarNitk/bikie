import type { BikeSearchParams } from "@bikie/types";
import { DEFAULT_BIKE_SEARCH_PAGE, DEFAULT_BIKE_SEARCH_PAGE_SIZE } from "../domain/search-defaults";
import type { CatalogPorts } from "../ports";

export function createBikeApplication(ports: CatalogPorts) {
  return {
    getFeatured(limit: number) {
      return ports.bikes.findFeatured(limit);
    },

    async search(params: BikeSearchParams) {
      const page = params.page ?? DEFAULT_BIKE_SEARCH_PAGE;
      const pageSize = params.pageSize ?? DEFAULT_BIKE_SEARCH_PAGE_SIZE;
      const { bikes, total } = await ports.bikes.search({ ...params, page, pageSize });
      return { bikes, total, page, pageSize };
    },

    getBySlug(slug: string) {
      return ports.bikes.findBySlug(slug);
    },

    getByOwner(ownerId: string) {
      return ports.bikes.findByOwner(ownerId);
    },
  };
}

export function createDestinationApplication(ports: CatalogPorts) {
  return {
    getPopular(limit: number) {
      return ports.destinations.findPopular(limit);
    },
    getAll() {
      return ports.destinations.findAll();
    },
    getBySlug(slug: string) {
      return ports.destinations.findBySlug(slug);
    },
  };
}

export function createCategoryApplication(ports: CatalogPorts) {
  return {
    getAll() {
      return ports.categories.findAll();
    },
  };
}

export function createTestimonialApplication(ports: CatalogPorts) {
  return {
    getFeatured(limit: number) {
      return ports.testimonials.findFeatured(limit);
    },
  };
}
