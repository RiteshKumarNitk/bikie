import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'testimonial_model.dart';

final testimonialRepositoryProvider = Provider<TestimonialRepository>((ref) {
  return TestimonialRepository(ref.watch(dioProvider));
});

class TestimonialRepository {
  TestimonialRepository(this._dio);

  final Dio _dio;

  Future<List<TestimonialModel>> getAll({int limit = 6}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/testimonials', queryParameters: {'limit': limit});
      return (res.data['testimonials'] as List)
          .map((e) => TestimonialModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }
}
