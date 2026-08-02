import { describe, expect, it, vi } from "vitest";

vi.mock("@bikie/database", () => ({
  bikeRepository: {},
  bookingRepository: {},
  reviewRepository: {},
  wishlistRepository: {},
}));

import {
  computeBookingTotal,
  createRentalsBookingsModule,
  evaluateReviewEligibility,
  initialBookingStatus,
  isValidBookingDateRange,
  rentalDaysBetween,
} from "./public";

describe("booking pricing domain", () => {
  it("counts at least one rental day", () => {
    const start = new Date("2026-08-01T10:00:00Z");
    const end = new Date("2026-08-01T18:00:00Z");
    expect(rentalDaysBetween(start, end)).toBe(1);
  });

  it("ceilings partial days", () => {
    const start = new Date("2026-08-01T00:00:00Z");
    const end = new Date("2026-08-03T01:00:00Z");
    expect(rentalDaysBetween(start, end)).toBe(3);
  });

  it("rejects inverted or invalid dates", () => {
    expect(isValidBookingDateRange(new Date("2026-08-02"), new Date("2026-08-01"))).toBe(false);
    expect(isValidBookingDateRange(new Date("bad"), new Date("2026-08-01"))).toBe(false);
    expect(isValidBookingDateRange(new Date("2026-08-01"), new Date("2026-08-02"))).toBe(true);
  });

  it("computes total and initial status", () => {
    const start = new Date("2026-08-01T00:00:00Z");
    const end = new Date("2026-08-03T00:00:00Z");
    expect(computeBookingTotal(1500, start, end)).toBe(3000);
    expect(initialBookingStatus(true)).toBe("CONFIRMED");
    expect(initialBookingStatus(false)).toBe("PENDING");
  });
});

describe("review eligibility domain", () => {
  it("requires a completed booking owned by the reviewer for that bike", () => {
    expect(
      evaluateReviewEligibility({
        booking: null,
        userId: "u1",
        bikeId: "b1",
        alreadyReviewed: false,
      }),
    ).toEqual({ ok: false, reason: "BOOKING_NOT_FOUND" });

    expect(
      evaluateReviewEligibility({
        booking: { userId: "u2", bikeId: "b1", status: "COMPLETED" },
        userId: "u1",
        bikeId: "b1",
        alreadyReviewed: false,
      }),
    ).toEqual({ ok: false, reason: "NOT_ELIGIBLE" });

    expect(
      evaluateReviewEligibility({
        booking: { userId: "u1", bikeId: "b1", status: "CONFIRMED" },
        userId: "u1",
        bikeId: "b1",
        alreadyReviewed: false,
      }),
    ).toEqual({ ok: false, reason: "NOT_ELIGIBLE" });

    expect(
      evaluateReviewEligibility({
        booking: { userId: "u1", bikeId: "b1", status: "COMPLETED" },
        userId: "u1",
        bikeId: "b1",
        alreadyReviewed: true,
      }),
    ).toEqual({ ok: false, reason: "ALREADY_REVIEWED" });

    expect(
      evaluateReviewEligibility({
        booking: { userId: "u1", bikeId: "b1", status: "COMPLETED" },
        userId: "u1",
        bikeId: "b1",
        alreadyReviewed: false,
      }),
    ).toEqual({ ok: true });
  });
});

describe("booking application", () => {
  it("returns BIKE_NOT_FOUND / INVALID_DATES / BIKE_UNAVAILABLE / success", async () => {
    const createIfAvailable = vi.fn(async () => null);
    const module = createRentalsBookingsModule({
      bikes: {
        findForBooking: vi.fn(async (id) =>
          id === "bike-1"
            ? { id: "bike-1", pricePerDay: 1000, instantBooking: true }
            : null,
        ),
      },
      bookings: {
        createIfAvailable,
        findById: vi.fn(async () => null),
        findByUser: vi.fn(async () => []),
        findForPartner: vi.fn(async () => []),
      },
      reviews: {
        findByBookingId: vi.fn(async () => null),
        create: vi.fn(),
        findForBike: vi.fn(async () => []),
        findForUser: vi.fn(async () => []),
        findForOwner: vi.fn(async () => []),
      },
      wishlist: {
        findByUser: vi.fn(async () => []),
        add: vi.fn(),
        remove: vi.fn(),
      },
    });

    await expect(
      module.bookings.create("u1", {
        bikeId: "missing",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        pickupCity: "Bengaluru",
      }),
    ).resolves.toEqual({ ok: false, reason: "BIKE_NOT_FOUND" });

    await expect(
      module.bookings.create("u1", {
        bikeId: "bike-1",
        startDate: "2026-08-02",
        endDate: "2026-08-01",
        pickupCity: "Bengaluru",
      }),
    ).resolves.toEqual({ ok: false, reason: "INVALID_DATES" });

    await expect(
      module.bookings.create("u1", {
        bikeId: "bike-1",
        startDate: "2026-08-01",
        endDate: "2026-08-03",
        pickupCity: "Bengaluru",
      }),
    ).resolves.toEqual({ ok: false, reason: "BIKE_UNAVAILABLE" });

    expect(createIfAvailable).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        bikeId: "bike-1",
        totalPrice: 2000,
        status: "CONFIRMED",
        pickupCity: "Bengaluru",
      }),
    );

    createIfAvailable.mockResolvedValueOnce({ id: "bk-1" } as never);
    await expect(
      module.bookings.create("u1", {
        bikeId: "bike-1",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        pickupCity: "Bengaluru",
      }),
    ).resolves.toEqual({ ok: true, booking: { id: "bk-1" } });
  });
});

describe("review application", () => {
  it("maps eligibility failures and race ALREADY_REVIEWED", async () => {
    const module = createRentalsBookingsModule({
      bikes: { findForBooking: vi.fn(async () => null) },
      bookings: {
        createIfAvailable: vi.fn(),
        findById: vi.fn(async () => ({
          id: "bk-1",
          userId: "u1",
          bikeId: "b1",
          status: "COMPLETED",
        })),
        findByUser: vi.fn(async () => []),
        findForPartner: vi.fn(async () => []),
      },
      reviews: {
        findByBookingId: vi.fn(async () => null),
        create: vi.fn(async () => null),
        findForBike: vi.fn(async () => []),
        findForUser: vi.fn(async () => []),
        findForOwner: vi.fn(async () => []),
      },
      wishlist: {
        findByUser: vi.fn(async () => []),
        add: vi.fn(),
        remove: vi.fn(),
      },
    });

    await expect(
      module.reviews.create("u1", "b1", { bookingId: "bk-1", rating: 5, comment: "great" }),
    ).resolves.toEqual({ ok: false, reason: "ALREADY_REVIEWED" });
  });
});
