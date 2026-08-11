import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
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

  /// `paymentId` is ignored server-side for a free (price 0) plan — the server-side price is
  /// always the source of truth for whether a payment step is required, never a client claim.
  Future<PartnerMembership> purchase({required String planId, String? paymentId}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/partner-membership/purchase',
        data: {'planId': planId, if (paymentId != null) 'paymentId': paymentId},
      );
      return PartnerMembership.fromJson(res.data['membership'] as Map<String, dynamic>);
    });
  }
}
