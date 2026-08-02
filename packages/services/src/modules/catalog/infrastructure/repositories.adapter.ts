import {
  bikeRepository,
  categoryRepository,
  destinationRepository,
  testimonialRepository,
} from "@bikie/database";
import type {
  BikeCatalogPort,
  CategoryCatalogPort,
  DestinationCatalogPort,
  TestimonialCatalogPort,
} from "../ports";

export function createBikeCatalogAdapter(): BikeCatalogPort {
  return {
    findFeatured: (limit) => bikeRepository.findFeaturedBikes(limit),
    search: (params) => bikeRepository.searchBikes(params),
    findBySlug: (slug) => bikeRepository.findBikeBySlug(slug),
    findByOwner: (ownerId) => bikeRepository.findBikesByOwner(ownerId),
  };
}

export function createDestinationCatalogAdapter(): DestinationCatalogPort {
  return {
    findPopular: (limit) => destinationRepository.findPopularDestinations(limit),
    findAll: () => destinationRepository.findAllDestinations(),
    findBySlug: (slug) => destinationRepository.findDestinationBySlug(slug),
  };
}

export function createCategoryCatalogAdapter(): CategoryCatalogPort {
  return {
    findAll: () => categoryRepository.findAllCategories(),
  };
}

export function createTestimonialCatalogAdapter(): TestimonialCatalogPort {
  return {
    findFeatured: (limit) => testimonialRepository.findFeaturedTestimonials(limit),
  };
}
