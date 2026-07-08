export interface BookingDTO {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  pickupCity: string;
  createdAt: string;
  bike: {
    slug: string;
    name: string;
    imageUrl: string;
    brand: string;
  };
  hasReview: boolean;
}
