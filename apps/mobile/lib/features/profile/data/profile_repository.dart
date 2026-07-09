import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(dioProvider));
});

class ProfileRepository {
  ProfileRepository(this._dio);

  final Dio _dio;

  Future<void> updatePhone(String phone) {
    return apiGuard(() => _dio.patch('/api/user/phone', data: {'phone': phone}));
  }
}
