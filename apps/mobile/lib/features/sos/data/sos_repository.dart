import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'sos_model.dart';

final sosRepositoryProvider = Provider<SosRepository>((ref) {
  return SosRepository(ref.watch(dioProvider));
});

class SosRepository {
  SosRepository(this._dio);

  final Dio _dio;

  Future<List<SOSAlert>> getActive() {
    return apiGuard(() async {
      final res = await _dio.get('/api/sos/alerts');
      return (res.data['alerts'] as List).map((e) => SOSAlert.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<List<SOSAlert>> getHistory() {
    return apiGuard(() async {
      final res = await _dio.get('/api/sos/alerts/history');
      return (res.data['alerts'] as List).map((e) => SOSAlert.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<SOSAlert> create({
    required String type,
    String? description,
    required double latitude,
    required double longitude,
    required String city,
  }) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/sos/alerts',
        data: {
          'type': type,
          if (description != null && description.isNotEmpty) 'description': description,
          'latitude': latitude,
          'longitude': longitude,
          'city': city,
        },
      );
      return SOSAlert.fromJson(res.data['alert'] as Map<String, dynamic>);
    });
  }

  Future<void> respond(String id) {
    return apiGuard(() => _dio.post('/api/sos/alerts/$id/respond'));
  }

  Future<void> resolve(String id) {
    return apiGuard(() => _dio.post('/api/sos/alerts/$id/resolve'));
  }
}
