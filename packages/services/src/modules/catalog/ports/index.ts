import type {
  BikeDetailDTO,
  BikeSearchParams,
  BikeSummaryDTO,
  CategoryDTO,
  DestinationDetailDTO,
  DestinationSummaryDTO,
  TestimonialDTO,
} from "@bikie/types";

export type BikeSearchResult = {
  bikes: BikeSummaryDTO[];
  total: number;
};

export interface BikeCatalogPort {
  findFeatured(limit: number): Promise<BikeSummaryDTO[]>;
  search(params: BikeSearchParams & { page: number; pageSize: number }): Promise<BikeSearchResult>;
  findBySlug(slug: string): Promise<BikeDetailDTO | null>;
  findByOwner(ownerId: string): Promise<BikeSummaryDTO[]>;
}

export interface DestinationCatalogPort {
  findPopular(limit: number): Promise<DestinationSummaryDTO[]>;
  findAll(): Promise<DestinationSummaryDTO[]>;
  findBySlug(slug: string): Promise<DestinationDetailDTO | null>;
}

export interface CategoryCatalogPort {
  findAll(): Promise<CategoryDTO[]>;
}

export interface TestimonialCatalogPort {
  findFeatured(limit: number): Promise<TestimonialDTO[]>;
}

export interface CatalogPorts {
  bikes: BikeCatalogPort;
  destinations: DestinationCatalogPort;
  categories: CategoryCatalogPort;
  testimonials: TestimonialCatalogPort;
}
