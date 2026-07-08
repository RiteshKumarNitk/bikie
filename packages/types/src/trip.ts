export interface TripSummaryDTO {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  type: string;
  difficulty: string;
  price: number;
  seatsTotal: number;
  seatsLeft: number;
  startDate: string;
  endDate: string;
  status: string;
  destination: { name: string; slug: string } | null;
}

export interface TripDetailDTO extends TripSummaryDTO {
  description: string;
  gallery: string[];
  organizer: { name: string; image: string | null };
}
