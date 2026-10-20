import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/payments/razorpay_checkout.dart';
import 'partner_membership_model.dart';

/// ADR-051 — mirrors `MembershipRepository`, entirely separate endpoints/data.
final partnerMembershipRepositoryProvider = Provider<PartnerMembershipRepository>((ref) {
  return PartnerMembershipRepository(ref.watch(dioProvider));
});

class PartnerMembershipRepository {
  PartnerMembershipRepository(this._dio);

  final Dio _dio;

  Future<PartnerMembership?> getActive() {
    return apiGuard(() async {
      final res = await _dio.get('/api/partner-membership/active');
      final membership = res.data['membership'];
      return membership == null ? null : PartnerMembership.fromJson(membership as Map<String, dynamic>);
    });
  }

  Future<List<PartnerMembershipPlan>> getPlans() {
    return apiGuard(() async {
      final res = await _dio.get('/api/partner-membership/plans');
      return (res.data['plans'] as List)
          .map((e) => PartnerMembershipPlan.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  /// `POST /api/partner-membership/checkout` (ADR-051) — creates a server-priced Razorpay order.
  /// Returns the order when Razorpay is configured and the plan is paid; `null` for a free plan
  /// (`{ free: true }`) or when Razorpay isn't configured (`razorpayConfigured: false`, dev
  /// only). `503 PAYMENTS_UNAVAILABLE` (paid plan, unconfigured Razorpay, production) surfaces as
  /// an [ApiException].
  Future<RazorpayOrder?> checkout({required String planId}) {
    return apiGuard(() async {
      final res = await _dio.post('/api/partner-membership/checkout', data: {'planId': planId});
      final data = res.data as Map<String, dynamic>;
      if (data['razorpayConfigured'] == true && data['order'] != null) {
        return RazorpayOrder.fromJson(data['order'] as Map<String, dynamic>);
      }
      return null;
    });
  }

  /// `POST /api/partner-membership/purchase`. A free (price 0) plan needs neither `paymentId` nor
  /// the Razorpay triple — the server-side price is the source of truth. For a paid plan, pass
  /// the Razorpay callback triple from a completed checkout.
  Future<PartnerMembership> purchase({
    required String planId,
    String? paymentId,
    String? razorpayOrderId,
    String? razorpayPaymentId,
    String? razorpaySignature,
  }) {
    return apiGuard(() async {
      final res = await _dio.post('/api/partner-membership/purchase', data: {
        'planId': planId,
        if (paymentId != null) 'paymentId': paymentId,
        if (razorpayOrderId != null) 'razorpayOrderId': razorpayOrderId,
        if (razorpayPaymentId != null) 'razorpayPaymentId': razorpayPaymentId,
        if (razorpaySignature != null) 'razorpaySignature': razorpaySignature,
      });
      return PartnerMembership.fromJson(res.data['membership'] as Map<String, dynamic>);
    });
  }

  /// `POST /api/partner-membership/subscription` — starts a ₹99/month recurring Razorpay
  /// Subscription. Does NOT activate the membership — that only happens once Razorpay's webhook
  /// confirms the first charge; the `shortUrl` is Razorpay's own hosted authorization page.
  Future<StartSubscriptionResult> startSubscription({required String planId}) {
    return apiGuard(() async {
      final res = await _dio.post('/api/partner-membership/subscription', data: {'planId': planId});
      final data = res.data as Map<String, dynamic>;
      return StartSubscriptionResult(
        membership: PartnerMembership.fromJson(data['membership'] as Map<String, dynamic>),
        shortUrl: (data['subscription'] as Map<String, dynamic>)['shortUrl'] as String,
      );
    });
  }

  /// `POST /api/partner-membership/subscription/cancel` — stops future recurring charges
  /// (`cancelAtCycleEnd`); the already-paid-for current period is retained until it naturally
  /// ends.
  Future<PartnerMembership> cancelSubscription() {
    return apiGuard(() async {
      final res = await _dio.post('/api/partner-membership/subscription/cancel');
      return PartnerMembership.fromJson(res.data['membership'] as Map<String, dynamic>);
    });
  }
}

class StartSubscriptionResult {
  const StartSubscriptionResult({required this.membership, required this.shortUrl});
  final PartnerMembership membership;
  final String shortUrl;
}
