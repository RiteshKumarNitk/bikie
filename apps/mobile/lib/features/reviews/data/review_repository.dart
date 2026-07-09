import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'review_model.dart';

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  return ReviewRepository(ref.watch(dioProvider));
});

class ReviewRepository {
  ReviewRepository(this._dio);

  final Dio _dio;

  Future<List<ReviewModel>> getForBike(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/bikes/$slug/reviews');
      return (res.data['reviews'] as List).map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<List<ReviewModel>> getMine() {
    return apiGuard(() async {
      final res = await _dio.get('/api/reviews/mine');
      return (res.data['reviews'] as List).map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<ReviewModel> create({
    required String bikeSlug,
    required String bookingId,
    required int rating,
    required String comment,
  }) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/bikes/$bikeSlug/reviews',
        data: {'bookingId': bookingId, 'rating': rating, 'comment': comment},
      );
      return ReviewModel.fromJson(res.data['review'] as Map<String, dynamic>);
    });
  }
}
