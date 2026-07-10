import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'trip_models.dart';

final tripRepositoryProvider = Provider<TripRepository>((ref) {
  return TripRepository(ref.watch(dioProvider));
});

class TripRepository {
  TripRepository(this._dio);

  final Dio _dio;

  Future<List<TripSummary>> getAll({String? tab}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips', queryParameters: tab != null ? {'tab': tab} : null);
      return (res.data['trips'] as List).map((e) => TripSummary.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<TripDetail> getBySlug(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/trips/$slug');
      return TripDetail.fromJson(res.data['trip'] as Map<String, dynamic>);
    });
  }
}
