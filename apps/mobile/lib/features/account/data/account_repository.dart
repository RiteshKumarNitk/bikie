import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';

final accountRepositoryProvider = Provider<AccountRepository>((ref) {
  return AccountRepository(ref.watch(dioProvider));
});

class AccountRepository {
  AccountRepository(this._dio);

  final Dio _dio;

  /// `POST /api/user/delete-account` — self-service deletion. Blocked server-side (surfaced as an
  /// `ApiException` with a user-facing `message`) while a Rider or Service Provider subscription
  /// is still actively auto-renewing; the caller must ask the user to cancel auto-renewal first.
  Future<void> deleteAccount() {
    return apiGuard(() async {
      await _dio.post('/api/user/delete-account');
    });
  }
}
