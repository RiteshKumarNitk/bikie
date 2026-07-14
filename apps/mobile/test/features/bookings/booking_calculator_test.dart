import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/bookings/domain/booking_calculator.dart';

void main() {
  group('calculateBookingDays', () {
    test('returns the whole-day difference between start and end', () {
      final start = DateTime(2026, 8, 1);
      final end = DateTime(2026, 8, 4);
      expect(calculateBookingDays(start, end), 3);
    });

    test('clamps a same-day pickup/return to a minimum of 1 day', () {
      final sameDay = DateTime(2026, 8, 1);
      expect(calculateBookingDays(sameDay, sameDay), 1);
    });

    test('clamps an inverted range (end before start) to 1 day rather than going negative', () {
      final start = DateTime(2026, 8, 10);
      final end = DateTime(2026, 8, 5);
      expect(calculateBookingDays(start, end), 1);
    });

    test('caps a runaway range defensively at 1000 days', () {
      final start = DateTime(2000, 1, 1);
      final end = DateTime(2100, 1, 1);
      expect(calculateBookingDays(start, end), 1000);
    });
  });

  group('calculateBookingTotal', () {
    test('multiplies price per day by the clamped day count', () {
      final start = DateTime(2026, 8, 1);
      final end = DateTime(2026, 8, 4);
      final total = calculateBookingTotal(start: start, end: end, pricePerDay: 500);
      expect(total, 1500);
    });

    test('bills a single day for a same-day range', () {
      final day = DateTime(2026, 8, 1);
      final total = calculateBookingTotal(start: day, end: day, pricePerDay: 750);
      expect(total, 750);
    });

    test('supports fractional (num) price per day', () {
      final start = DateTime(2026, 8, 1);
      final end = DateTime(2026, 8, 3);
      final total = calculateBookingTotal(start: start, end: end, pricePerDay: 499.5);
      expect(total, 999.0);
    });
  });
}
