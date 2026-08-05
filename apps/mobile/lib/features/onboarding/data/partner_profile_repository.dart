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
    };
  }

  bool _notBlank(String? value) => value != null && value.trim().isNotEmpty;
}
