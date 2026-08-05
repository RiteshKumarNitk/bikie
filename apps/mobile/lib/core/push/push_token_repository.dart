import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_guard.dart';
import '../network/dio_client.dart';

final pushTokenRepositoryProvider = Provider<PushTokenRepository>((ref) {
  return PushTokenRepository(ref.watch(dioProvider));
});

/// `PUT`/`DELETE /api/notifications/push-token` — the same route the web app has always used
/// for its FCM Web tokens (ADR-016), extended (not duplicated) with optional device metadata
/// so it can also carry Android registrations (ADR-035).
class PushTokenRepository {
  PushTokenRepository(this._dio);

  final Dio _dio;

  Future<void> register({
    required String token,
    required String deviceId,
    String? deviceName,
    String? appVersion,
  }) {
    return apiGuard(() => _dio.put(
          '/api/notifications/push-token',
          data: {
            'token': token,
            'platform': 'ANDROID',
            'deviceId': deviceId,
            if (deviceName != null && deviceName.isNotEmpty) 'deviceName': deviceName,
            if (appVersion != null) 'appVersion': appVersion,
          },
        ));
  }

  Future<void> unregister(String token) {
    return apiGuard(() => _dio.delete('/api/notifications/push-token', data: {'token': token}));
  }
}
