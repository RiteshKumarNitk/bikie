/** Inclusive rental-day count — at least 1 day even for same-calendar sub-24h windows. */
export function rentalDaysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isValidBookingDateRange(start: Date, end: Date): boolean {
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
}

export function computeBookingTotal(pricePerDay: number, start: Date, end: Date): number {
  return pricePerDay * rentalDaysBetween(start, end);
}

/** Instant-book bikes confirm immediately; others wait for partner approval. */
export function initialBookingStatus(instantBooking: boolean): "PENDING" | "CONFIRMED" {
  return instantBooking ? "CONFIRMED" : "PENDING";
}
