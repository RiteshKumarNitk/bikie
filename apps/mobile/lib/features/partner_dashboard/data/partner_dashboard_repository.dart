import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'partner_dashboard_model.dart';

final partnerDashboardRepositoryProvider = Provider<PartnerDashboardRepository>((ref) {
  return PartnerDashboardRepository(ref.watch(dioProvider));
});

/// `GET /api/partner/sos/{dashboard,nearby,active}`, `PATCH /api/partner/availability` (ADR-044)
/// — the partner Emergency Assistance Dashboard's own data, distinct from the generic
/// `SosRepository` (offer/accept/session lifecycle, shared with riders) this feature reuses
/// as-is for the actual request/accept/confirm flow.
class PartnerDashboardRepository {
  PartnerDashboardRepository(this._dio);

  final Dio _dio;

  /// `location` is optional — without it, `activeRequests` reports 0 rather than the call failing.
  Future<PartnerSosStats> getStats({double? latitude, double? longitude}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/partner/sos/dashboard',
        queryParameters: latitude != null && longitude != null ? {'lat': latitude, 'lng': longitude} : null,
      );
      return PartnerSosStats.fromJson(res.data['stats'] as Map<String, dynamic>);
    });
  }

  Future<List<PartnerNearbyRequest>> getNearbyRequests({required double latitude, required double longitude}) {
    return apiGuard(() async {
      final res = await _dio.get(
        '/api/partner/sos/nearby',
        queryParameters: {'lat': latitude, 'lng': longitude},
      );
      return (res.data['requests'] as List)
          .map((e) => PartnerNearbyRequest.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<List<PartnerActiveSession>> getActiveAssistance() {
    return apiGuard(() async {
      final res = await _dio.get('/api/partner/sos/active');
      return (res.data['sessions'] as List)
          .map((e) => PartnerActiveSession.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<bool> setAvailability(bool isAvailable) {
    return apiGuard(() async {
      final res = await _dio.patch('/api/partner/availability', data: {'isAvailable': isAvailable});
      return res.data['isAvailable'] as bool;
    });
  }
}
