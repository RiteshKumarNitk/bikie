import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'referral_model.dart';

final referralRepositoryProvider = Provider<ReferralRepository>((ref) {
  return ReferralRepository(ref.watch(dioProvider));
});

class ReferralRepository {
  ReferralRepository(this._dio);

  final Dio _dio;

  Future<ReferralInfo> getMine() {
    return apiGuard(() async {
      final res = await _dio.get('/api/referrals/me');
      return ReferralInfo.fromJson(res.data as Map<String, dynamic>);
    });
  }

  Future<void> link(String code) {
    return apiGuard(() => _dio.post('/api/referrals/link', data: {'code': code}));
  }
}
