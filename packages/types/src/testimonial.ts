export interface TestimonialDTO {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorLocation: string | null;
  rating: number;
  quote: string;
}
