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
}
