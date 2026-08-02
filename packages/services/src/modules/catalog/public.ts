import { createBikeApplication, createCategoryApplication, createDestinationApplication, createTestimonialApplication } from "./application/catalog.application";
import {
  createBikeCatalogAdapter,
  createCategoryCatalogAdapter,
  createDestinationCatalogAdapter,
  createTestimonialCatalogAdapter,
} from "./infrastructure/repositories.adapter";
import type { CatalogPorts } from "./ports";

export type CatalogModule = {
  ports: CatalogPorts;
  bikes: ReturnType<typeof createBikeApplication>;
  destinations: ReturnType<typeof createDestinationApplication>;
  categories: ReturnType<typeof createCategoryApplication>;
  testimonials: ReturnType<typeof createTestimonialApplication>;
};

export type CatalogDeps = Partial<CatalogPorts>;

export function createCatalogModule(overrides: CatalogDeps = {}): CatalogModule {
  const ports: CatalogPorts = {
    bikes: overrides.bikes ?? createBikeCatalogAdapter(),
    destinations: overrides.destinations ?? createDestinationCatalogAdapter(),
    categories: overrides.categories ?? createCategoryCatalogAdapter(),
    testimonials: overrides.testimonials ?? createTestimonialCatalogAdapter(),
  };

  return {
    ports,
    bikes: createBikeApplication(ports),
    destinations: createDestinationApplication(ports),
    categories: createCategoryApplication(ports),
    testimonials: createTestimonialApplication(ports),
  };
}

let defaultModule: CatalogModule | null = null;

export function getCatalogModule(): CatalogModule {
  if (!defaultModule) defaultModule = createCatalogModule();
  return defaultModule;
}

export function setCatalogModuleForTests(module: CatalogModule | null): void {
  defaultModule = module;
}

export type { CatalogPorts } from "./ports";
export { DEFAULT_BIKE_SEARCH_PAGE, DEFAULT_BIKE_SEARCH_PAGE_SIZE } from "./domain/search-defaults";
