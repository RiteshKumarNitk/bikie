import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import 'account_type_request_model.dart';

final accountTypeRequestRepositoryProvider = Provider<AccountTypeRequestRepository>((ref) {
  return AccountTypeRequestRepository(ref.watch(dioProvider));
});

/// ADR-053 — "I picked the wrong account type" support ticket. `accountType` is never
/// self-service; this is the only way (besides registration) to ask for it to change, and only
/// an admin approving the request actually changes it.
class AccountTypeRequestRepository {
  AccountTypeRequestRepository(this._dio);

  final Dio _dio;

  Future<List<AccountTypeChangeRequest>> getMine() {
    return apiGuard(() async {
      final res = await _dio.get('/api/account-type-requests');
      final list = (res.data['requests'] as List).cast<Map<String, dynamic>>();
      return list.map(AccountTypeChangeRequest.fromJson).toList();
    });
  }

  Future<void> submit({required String requestedType, required String reason, String? supportingInfo}) {
    return apiGuard(() => _dio.post('/api/account-type-requests', data: {
          'requestedType': requestedType,
          'reason': reason,
          if (supportingInfo != null && supportingInfo.isNotEmpty) 'supportingInfo': supportingInfo,
        }));
  }
}
