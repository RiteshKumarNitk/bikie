import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/payments/razorpay_checkout.dart';
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

  /// `POST /api/membership/checkout` (ADR-043) — creates a server-priced Razorpay order.
  /// Returns the order when Razorpay is configured; `null` when it isn't (`razorpayConfigured:
  /// false` — the simulated/dev path, which the server only allows outside production). A
  /// non-2xx (e.g. `503 PAYMENTS_UNAVAILABLE` in production) surfaces as an [ApiException].
  Future<RazorpayOrder?> checkout({required String planId}) {
    return apiGuard(() async {
      final res = await _dio.post('/api/membership/checkout', data: {'planId': planId});
      final data = res.data as Map<String, dynamic>;
      if (data['razorpayConfigured'] == true && data['order'] != null) {
        return RazorpayOrder.fromJson(data['order'] as Map<String, dynamic>);
      }
      return null;
    });
  }

  /// `POST /api/membership/purchase`. Pass the Razorpay callback triple after a completed
  /// checkout (the server verifies the signature), or a bare `paymentId` on the simulated/dev
  /// path only.
  Future<UserMembership> purchase({
    required String planId,
    String? paymentId,
    String? razorpayOrderId,
    String? razorpayPaymentId,
    String? razorpaySignature,
  }) {
    return apiGuard(() async {
      final res = await _dio.post('/api/membership/purchase', data: {
        'planId': planId,
        if (paymentId != null) 'paymentId': paymentId,
        if (razorpayOrderId != null) 'razorpayOrderId': razorpayOrderId,
        if (razorpayPaymentId != null) 'razorpayPaymentId': razorpayPaymentId,
        if (razorpaySignature != null) 'razorpaySignature': razorpaySignature,
      });
      return UserMembership.fromJson(res.data['membership'] as Map<String, dynamic>);
    });
  }
}
