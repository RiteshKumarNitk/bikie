import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'nearby_riders_model.dart';

final nearbyRidersRepositoryProvider = Provider<NearbyRidersRepository>((ref) {
  return NearbyRidersRepository(ref.watch(dioProvider));
});

/// Live-location sharing + nearby-rider search (ADR-016) — didn't exist on mobile at all
/// before ADR-033's Phase C (web-only until now).
class NearbyRidersRepository {
  NearbyRidersRepository(this._dio);

  final Dio _dio;

  Future<bool> getSharingEnabled() {
    return apiGuard(() async {
      final res = await _dio.get('/api/rider-location/consent');
      return res.data['enabled'] as bool;
    });
  }

  Future<void> setSharingEnabled(bool enabled) {
    return apiGuard(() => _dio.put('/api/rider-location/consent', data: {'enabled': enabled}));
  }

  /// Throws `ApiException` with `errorCode == 'SHARING_DISABLED'` (409) if sharing isn't on.
  Future<void> updateLocation(double latitude, double longitude) {
    return apiGuard(
      () => _dio.put('/api/rider-location', data: {'latitude': latitude, 'longitude': longitude}),
    );
  }

  /// Throws `ApiException` with `errorCode == 'SHARING_DISABLED'` (409) if the caller's own
  /// sharing is off — the search self-joins on the caller's own fix as its center.
  Future<List<NearbyRider>> findNearby({int radiusKm = 5}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/riders/nearby', queryParameters: {'radiusKm': radiusKm});
      return (res.data['riders'] as List).map((e) => NearbyRider.fromJson(e as Map<String, dynamic>)).toList();
    });
  }
}
