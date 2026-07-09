import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/booking_model.dart';
import '../data/booking_repository.dart';

final myBookingsProvider = AsyncNotifierProvider.autoDispose<MyBookingsNotifier, List<BookingModel>>(
  MyBookingsNotifier.new,
);

class MyBookingsNotifier extends AutoDisposeAsyncNotifier<List<BookingModel>> {
  @override
  Future<List<BookingModel>> build() {
    return ref.watch(bookingRepositoryProvider).getMine();
  }

  Future<BookingModel> create({
    required String bikeId,
    required DateTime startDate,
    required DateTime endDate,
    required String pickupCity,
  }) async {
    final booking = await ref.read(bookingRepositoryProvider).create(
          bikeId: bikeId,
          startDate: startDate,
          endDate: endDate,
          pickupCity: pickupCity,
        );
    ref.invalidateSelf();
    return booking;
  }
}
