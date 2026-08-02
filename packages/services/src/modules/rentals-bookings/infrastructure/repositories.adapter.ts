import { bikeRepository, bookingRepository, reviewRepository, wishlistRepository } from "@bikie/database";
import type {
  BikeLookupPort,
  BookingRepositoryPort,
  ReviewRepositoryPort,
  WishlistRepositoryPort,
} from "../ports";

export function createBikeLookupAdapter(): BikeLookupPort {
  return {
    findForBooking: (bikeId) => bikeRepository.findBikeForBooking(bikeId),
  };
}

export function createBookingRepositoryAdapter(): BookingRepositoryPort {
  return {
    createIfAvailable: (data) => bookingRepository.createBookingIfAvailable(data),
    async findById(id) {
      const booking = await bookingRepository.findBookingById(id);
      if (!booking) return null;
      return {
        id: booking.id,
        userId: booking.userId,
        bikeId: booking.bikeId,
        status: booking.status,
      };
    },
    findByUser: (userId, status) => bookingRepository.findBookingsByUser(userId, status),
    findForPartner: (ownerId) => bookingRepository.findBookingsForPartnerBikes(ownerId),
  };
}

export function createReviewRepositoryAdapter(): ReviewRepositoryPort {
  return {
    async findByBookingId(bookingId) {
      const review = await reviewRepository.findReviewByBookingId(bookingId);
      return review ? { id: review.id } : null;
    },
    create: (data) => reviewRepository.createReview(data),
    findForBike: (bikeId) => reviewRepository.findReviewsForBike(bikeId),
    findForUser: (userId) => reviewRepository.findReviewsByUser(userId),
    findForOwner: (ownerId) => reviewRepository.findReviewsForOwner(ownerId),
  };
}

export function createWishlistRepositoryAdapter(): WishlistRepositoryPort {
  return {
    findByUser: (userId) => wishlistRepository.findWishlistByUser(userId),
    add: (userId, bikeId) => wishlistRepository.addToWishlist(userId, bikeId),
    remove: (userId, bikeId) => wishlistRepository.removeFromWishlist(userId, bikeId),
  };
}
