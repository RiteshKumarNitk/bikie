import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'bike_models.dart';
import 'category_model.dart';

final bikeRepositoryProvider = Provider<BikeRepository>((ref) {
  return BikeRepository(ref.watch(dioProvider));
});

class BikeRepository {
  BikeRepository(this._dio);

  final Dio _dio;

  Future<List<BikeSummary>> getFeatured({int limit = 8}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/bikes/featured', queryParameters: {'limit': limit});
      return (res.data['bikes'] as List).map((e) => BikeSummary.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<BikeSearchResult> search(BikeSearchParams params) {
    return apiGuard(() async {
      final res = await _dio.get('/api/bikes', queryParameters: params.toQuery());
      return BikeSearchResult.fromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<BikeDetail> getBySlug(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/bikes/$slug');
      return BikeDetail.fromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<List<CategoryModel>> getCategories() {
    return apiGuard(() async {
      final res = await _dio.get('/api/categories');
      return (res.data['categories'] as List)
          .map((e) => CategoryModel.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }
}
