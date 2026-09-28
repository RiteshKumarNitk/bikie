import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'legal_models.dart';

final legalRepositoryProvider = Provider<LegalRepository>((ref) {
  return LegalRepository(ref.watch(dioProvider));
});

/// ADR-090 — read-only on mobile. Legal documents are managed only from the web Admin Dashboard;
/// the app just shows the current versions and sends consent at signup.
class LegalRepository {
  LegalRepository(this._dio);

  final Dio _dio;

  /// Public (no session needed) — used by the signup screen before an account exists.
  Future<CurrentLegalDocuments> getCurrent() {
    return apiGuard(() async {
      final res = await _dio.get('/api/legal/current');
      return CurrentLegalDocuments.fromJson(res.data as Map<String, dynamic>);
    });
  }
}
