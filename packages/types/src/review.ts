export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    name: string;
    image: string | null;
  };
  bike?: {
    slug: string;
    name: string;
  };
}
