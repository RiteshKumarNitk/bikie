import { createBookingApplication } from "./application/booking.application";
import { createReviewApplication } from "./application/review.application";
import { createWishlistApplication } from "./application/wishlist.application";
import {
  createBikeLookupAdapter,
  createBookingRepositoryAdapter,
  createReviewRepositoryAdapter,
  createWishlistRepositoryAdapter,
} from "./infrastructure/repositories.adapter";
import type { RentalsBookingsPorts } from "./ports";

export type RentalsBookingsModule = {
  ports: RentalsBookingsPorts;
  bookings: ReturnType<typeof createBookingApplication>;
  reviews: ReturnType<typeof createReviewApplication>;
  wishlist: ReturnType<typeof createWishlistApplication>;
};

export type RentalsBookingsDeps = Partial<RentalsBookingsPorts>;

export function createRentalsBookingsModule(
  overrides: RentalsBookingsDeps = {},
): RentalsBookingsModule {
  const ports: RentalsBookingsPorts = {
    bikes: overrides.bikes ?? createBikeLookupAdapter(),
    bookings: overrides.bookings ?? createBookingRepositoryAdapter(),
    reviews: overrides.reviews ?? createReviewRepositoryAdapter(),
    wishlist: overrides.wishlist ?? createWishlistRepositoryAdapter(),
  };

  return {
    ports,
    bookings: createBookingApplication(ports),
    reviews: createReviewApplication(ports),
    wishlist: createWishlistApplication(ports),
  };
}

let defaultModule: RentalsBookingsModule | null = null;

export function getRentalsBookingsModule(): RentalsBookingsModule {
  if (!defaultModule) defaultModule = createRentalsBookingsModule();
  return defaultModule;
}

export function setRentalsBookingsModuleForTests(module: RentalsBookingsModule | null): void {
  defaultModule = module;
}

export type { RentalsBookingsPorts } from "./ports";
export type { CreateBookingResult } from "./application/booking.application";
export type { CreateReviewResult } from "./application/review.application";
export {
  computeBookingTotal,
  initialBookingStatus,
  isValidBookingDateRange,
  rentalDaysBetween,
} from "./domain/pricing";
export { evaluateReviewEligibility } from "./domain/review-eligibility";
