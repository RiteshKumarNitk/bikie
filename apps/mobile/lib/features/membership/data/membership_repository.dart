import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'membership_model.dart';

final membershipRepositoryProvider = Provider<MembershipRepository>((ref) {
  return MembershipRepository(ref.watch(dioProvider));
});

class MembershipRepository {
  MembershipRepository(this._dio);

  final Dio _dio;

  Future<UserMembership?> getActive() {
    return apiGuard(() async {
      final res = await _dio.get('/api/membership/active');
      final membership = res.data['membership'];
      return membership == null ? null : UserMembership.fromJson(membership as Map<String, dynamic>);
    });
  }

  Future<List<MembershipPlan>> getPlans() {
    return apiGuard(() async {
      final res = await _dio.get('/api/membership/plans');
      return (res.data['plans'] as List).map((e) => MembershipPlan.fromJson(e as Map<String, dynamic>)).toList();
    });
  }

  Future<UserMembership> purchase({required String planId, required String paymentId}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/membership/purchase',
        data: {'planId': planId, 'paymentId': paymentId},
      );
      return UserMembership.fromJson(res.data['membership'] as Map<String, dynamic>);
    });
  }
}
