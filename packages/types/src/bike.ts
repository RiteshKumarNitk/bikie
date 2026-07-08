export interface BikeSummaryDTO {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: {
    name: string;
    slug: string;
  };
  pricePerDay: number;
  city: string;
  imageUrl: string;
  ratingAvg: number;
  ratingCount: number;
  instantBooking: boolean;
}

export interface BikeDetailDTO extends BikeSummaryDTO {
  gallery: string[];
  description: string | null;
  securityDeposit: number;
  engineCc: number | null;
  mileageKmpl: number | null;
  fuelTankLitres: number | null;
  hasAbs: boolean;
  seatHeightMm: number | null;
  luggageCapacityL: number | null;
  helmetIncluded: boolean;
  deliveryAvailable: boolean;
  destination: { name: string; slug: string } | null;
}

export interface BikeSearchResultDTO {
  bikes: BikeSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BikeSearchParams {
  location?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  instantBooking?: boolean;
  sort?: "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
}
