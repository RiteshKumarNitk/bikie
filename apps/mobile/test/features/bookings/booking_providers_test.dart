import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/bookings/data/booking_model.dart';
import 'package:mobile/features/bookings/data/booking_repository.dart';
import 'package:mobile/features/bookings/domain/booking_providers.dart';
import 'package:mocktail/mocktail.dart';

class _MockBookingRepository extends Mock implements BookingRepository {}

BookingModel _booking({String status = 'PENDING'}) => BookingModel(
      id: 'booking-1',
      status: status,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-04T00:00:00.000Z',
      totalPrice: 1500,
      pickupCity: 'Bengaluru',
      createdAt: '2026-07-14T00:00:00.000Z',
      bike: const BookingBikeRef(
        slug: 'royal-enfield-classic',
        name: 'Classic 350',
        imageUrl: 'https://example.com/bike.jpg',
        brand: 'Royal Enfield',
      ),
      hasReview: false,
    );

void main() {
  late _MockBookingRepository repository;
  late ProviderContainer container;

  setUp(() {
    repository = _MockBookingRepository();
    container = ProviderContainer(
      overrides: [bookingRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);
  });

  test('build() loads the current user bookings via the repository', () async {
    when(() => repository.getMine()).thenAnswer((_) async => [_booking()]);

    final result = await container.read(myBookingsProvider.future);

    expect(result, hasLength(1));
    expect(result.single.id, 'booking-1');
    verify(() => repository.getMine()).called(1);
  });

  test('create() delegates to the repository and refreshes the list', () async {
    when(() => repository.getMine()).thenAnswer((_) async => <BookingModel>[]);
    when(
      () => repository.create(
        bikeId: any(named: 'bikeId'),
        startDate: any(named: 'startDate'),
        endDate: any(named: 'endDate'),
        pickupCity: any(named: 'pickupCity'),
      ),
    ).thenAnswer((_) async => _booking(status: 'CONFIRMED'));

    // Prime the notifier so it's built before we call create().
    await container.read(myBookingsProvider.future);

    // After create(), getMine() should be called again (invalidateSelf).
    when(() => repository.getMine()).thenAnswer((_) async => [_booking(status: 'CONFIRMED')]);

    final start = DateTime.utc(2026, 8, 1);
    final end = DateTime.utc(2026, 8, 4);
    final created = await container.read(myBookingsProvider.notifier).create(
          bikeId: 'bike-1',
          startDate: start,
          endDate: end,
          pickupCity: 'Bengaluru',
        );

    expect(created.status, 'CONFIRMED');
    verify(
      () => repository.create(
        bikeId: 'bike-1',
        startDate: start,
        endDate: end,
        pickupCity: 'Bengaluru',
      ),
    ).called(1);

    // invalidateSelf() triggers a rebuild — wait for the refreshed value.
    final refreshed = await container.read(myBookingsProvider.future);
    expect(refreshed.single.status, 'CONFIRMED');
    verify(() => repository.getMine()).called(2);
  });
}
