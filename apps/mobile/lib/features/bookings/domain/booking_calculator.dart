/// Pure date-range and pricing calculations for booking creation, extracted
/// out of `CreateBookingSheet` widget state so they're testable in isolation
/// (see `test/features/bookings/booking_calculator_test.dart`) without
/// spinning up the widget tree.
library;

/// Number of rental days for a pickup/return date range.
///
/// Clamped to a minimum of 1 — a same-day pickup/return still bills for one
/// day — and capped defensively at 1000 to avoid runaway totals from a bad
/// date picker result.
int calculateBookingDays(DateTime start, DateTime end) {
  return end.difference(start).inDays.clamp(1, 1000);
}

/// Total price for a booking: `pricePerDay` × the clamped day count between
/// `start` and `end`.
num calculateBookingTotal({
  required DateTime start,
  required DateTime end,
  required num pricePerDay,
}) {
  return pricePerDay * calculateBookingDays(start, end);
}
