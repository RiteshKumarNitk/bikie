import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'partner_profile_model.dart';

final partnerProfileRepositoryProvider = Provider<PartnerProfileRepository>((ref) {
  return PartnerProfileRepository(ref.watch(dioProvider));
});

/// `PUT /api/partner/profile` — the same partner-profile API the web `/partner-onboarding` form
/// uses.
class PartnerProfileRepository {
  PartnerProfileRepository(this._dio);

  final Dio _dio;

  Future<void> save(PartnerProfileInput input) {
    return apiGuard(() => _dio.put('/api/partner/profile', data: _toRequestJson(input)));
  }

  Map<String, dynamic> _toRequestJson(PartnerProfileInput input) {
    return {
      'businessName': input.businessName,
      'type': input.type,
      'city': input.city,
      if (_notBlank(input.description)) 'description': input.description,
      if (_notBlank(input.aadhaarNumber)) 'aadhaarNumber': input.aadhaarNumber,
      if (_notBlank(input.contactPerson1Name)) 'contactPerson1Name': input.contactPerson1Name,
      if (_notBlank(input.contactPerson1Mobile)) 'contactPerson1Mobile': input.contactPerson1Mobile,
      if (_notBlank(input.contactPerson2Name)) 'contactPerson2Name': input.contactPerson2Name,
      if (_notBlank(input.contactPerson2Mobile)) 'contactPerson2Mobile': input.contactPerson2Mobile,
    };
  }

  bool _notBlank(String? value) => value != null && value.trim().isNotEmpty;
}
