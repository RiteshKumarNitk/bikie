import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'partner_model.dart';

final partnersRepositoryProvider = Provider<PartnersRepository>((ref) {
  return PartnersRepository(ref.watch(dioProvider));
});

/// Public "find a service provider near me" (ADR-036) — `GET /api/partners/nearby`, no session
/// required. Mirrors `RiderProfileRepository`/`NearbyRidersRepository`'s thin-wrapper shape.
class PartnersRepository {
  PartnersRepository(this._dio);

  final Dio _dio;

  Future<List<NearbyPartner>> findNearby(double latitude, double longitude, {String? type}) {
    return apiGuard(() async {
      final res = await _dio.get('/api/partners/nearby', queryParameters: {
        'lat': latitude,
        'lng': longitude,
        if (type != null) 'type': type,
      });
      return (res.data['partners'] as List).map((e) => NearbyPartner.fromJson(e as Map<String, dynamic>)).toList();
    });
  }
}
