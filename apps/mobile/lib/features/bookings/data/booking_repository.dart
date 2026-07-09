import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'booking_model.dart';

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  return BookingRepository(ref.watch(dioProvider));
});

class BookingRepository {
  BookingRepository(this._dio);

  final Dio _dio;

  Future<List<BookingModel>> getMine({String? status}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/bookings',
        queryParameters: status != null ? {'status': status} : null,
      );
      return (res.data['bookings'] as List).map((e) => BookingModel.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<BookingModel> create({
    required String bikeId,
    required DateTime startDate,
    required DateTime endDate,
    required String pickupCity,
  }) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/bookings',
        data: {
          'bikeId': bikeId,
          'startDate': startDate.toUtc().toIso8601String(),
          'endDate': endDate.toUtc().toIso8601String(),
          'pickupCity': pickupCity,
        },
      );
      return BookingModel.fromJson(res.data['booking'] as Map<String, dynamic>);
    });
  }
}
