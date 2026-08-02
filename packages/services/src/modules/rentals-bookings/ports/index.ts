import type { BookingDTO, ReviewDTO, WishlistItemDTO } from "@bikie/types";

export type BikeForBooking = {
  id: string;
  pricePerDay: number;
  instantBooking: boolean;
};

export type BookingRecord = {
  id: string;
  userId: string;
  bikeId: string;
  status: string;
};

export type CreateBookingData = {
  userId: string;
  bikeId: string;
  startDate: Date;
  endDate: Date;
  pickupCity: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED";
};

export interface BikeLookupPort {
  findForBooking(bikeId: string): Promise<BikeForBooking | null>;
}

export interface BookingRepositoryPort {
  createIfAvailable(data: CreateBookingData): Promise<BookingDTO | null>;
  findById(id: string): Promise<BookingRecord | null>;
  findByUser(userId: string, status?: string): Promise<BookingDTO[]>;
  findForPartner(ownerId: string): Promise<BookingDTO[]>;
}

export interface ReviewRepositoryPort {
  findByBookingId(bookingId: string): Promise<{ id: string } | null>;
  create(data: {
    userId: string;
    bikeId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }): Promise<ReviewDTO | null>;
  findForBike(bikeId: string): Promise<ReviewDTO[]>;
  findForUser(userId: string): Promise<ReviewDTO[]>;
  findForOwner(ownerId: string): Promise<ReviewDTO[]>;
}

export interface WishlistRepositoryPort {
  findByUser(userId: string): Promise<WishlistItemDTO[]>;
  add(userId: string, bikeId: string): Promise<void>;
  remove(userId: string, bikeId: string): Promise<void>;
}

export interface RentalsBookingsPorts {
  bikes: BikeLookupPort;
  bookings: BookingRepositoryPort;
  reviews: ReviewRepositoryPort;
  wishlist: WishlistRepositoryPort;
}
