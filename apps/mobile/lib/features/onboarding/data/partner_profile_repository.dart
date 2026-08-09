import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'partner_profile_model.dart';

final partnerProfileRepositoryProvider = Provider<PartnerProfileRepository>((ref) {
  return PartnerProfileRepository(ref.watch(dioProvider));
});

/// Backs the Partner Profile tab's "Business Profile" tile (verification badge + edit-form
/// prefill) — a thin, separately-invalidatable read so editing the profile doesn't have to also
/// refetch/duplicate `partnerAvailabilityProvider`'s own `getProfile()` call.
final partnerProfileSummaryProvider = FutureProvider.autoDispose<PartnerProfileSummary?>((ref) {
  return ref.watch(partnerProfileRepositoryProvider).getProfile();
});

/// `PUT /api/partner/profile` — the same partner-profile API the web `/partner-onboarding` form
/// uses.
class PartnerProfileRepository {
  PartnerProfileRepository(this._dio);

  final Dio _dio;

  Future<void> save(PartnerProfileInput input) {
    return apiGuard(() => _dio.put('/api/partner/profile', data: _toRequestJson(input)));
  }

  /// ADR-044 — `null` only if this account has no `Partner` row yet (shouldn't happen once past
  /// onboarding, but the API allows it since `PartnerService.getProfile` can return `null`).
  Future<PartnerProfileSummary?> getProfile() {
    return apiGuard(() async {
      final res = await _dio.get('/api/partner/profile');
      final profile = res.data['profile'];
      return profile == null ? null : PartnerProfileSummary.fromJson(profile as Map<String, dynamic>);
    });
  }

  Map<String, dynamic> _toRequestJson(PartnerProfileInput input) {
    return {
      'businessName': input.businessName,
      'type': input.type,
      'city': input.city,
      if (_notBlank(input.description)) 'description': input.description,
      if (_notBlank(input.contactPerson1Name)) 'contactPerson1Name': input.contactPerson1Name,
      if (_notBlank(input.contactPerson1Mobile)) 'contactPerson1Mobile': input.contactPerson1Mobile,
      if (_notBlank(input.contactPerson2Name)) 'contactPerson2Name': input.contactPerson2Name,
      if (_notBlank(input.contactPerson2Mobile)) 'contactPerson2Mobile': input.contactPerson2Mobile,
      if (_notBlank(input.addressLine)) 'addressLine': input.addressLine,
      if (_notBlank(input.area)) 'area': input.area,
      if (_notBlank(input.pincode)) 'pincode': input.pincode,
      if (input.latitude != null) 'latitude': input.latitude,
      if (input.longitude != null) 'longitude': input.longitude,
      if (_notBlank(input.governmentIdType)) 'governmentIdType': input.governmentIdType,
      if (_notBlank(input.governmentIdNumber)) 'governmentIdNumber': input.governmentIdNumber,
      if (input.isGeneralResponder != null) 'isGeneralResponder': input.isGeneralResponder,
    };
  }

  bool _notBlank(String? value) => value != null && value.trim().isNotEmpty;
}
