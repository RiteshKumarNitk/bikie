import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'destination_models.dart';

final destinationRepositoryProvider = Provider<DestinationRepository>((ref) {
  return DestinationRepository(ref.watch(dioProvider));
});

class DestinationRepository {
  DestinationRepository(this._dio);

  final Dio _dio;

  Future<List<DestinationSummary>> getPopular({int limit = 6}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/destinations/popular', queryParameters: {'limit': limit});
      return (res.data['destinations'] as List)
          .map((e) => DestinationSummary.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<List<DestinationSummary>> getAll() {
    return apiGuard(() async {
      final res = await _dio.get('/api/destinations');
      return (res.data['destinations'] as List)
          .map((e) => DestinationSummary.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<DestinationDetail> getBySlug(String slug) {
    return apiGuard(() async {
      final res = await _dio.get('/api/destinations/$slug');
      return DestinationDetail.fromJson(res.data['destination'] as Map<String, dynamic>);
    });
  }
}
