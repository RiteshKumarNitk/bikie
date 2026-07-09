import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/providers.dart';
import '../../../core/storage/secure_storage.dart';
import 'user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider), ref.watch(secureStorageProvider));
});

class AuthRepository {
  AuthRepository(this._dio, this._storage);

  final Dio _dio;
  final SecureStorage _storage;

  Future<UserModel> signIn({required String email, required String password}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/auth/sign-in/email',
        data: {'email': email, 'password': password},
      );
      return _persistAndParseUser(res);
    });
  }

  Future<UserModel> signUp({required String name, required String email, required String password}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/auth/sign-up/email',
        data: {'name': name, 'email': email, 'password': password},
      );
      return _persistAndParseUser(res);
    });
  }

  Future<UserModel?> getSession() {
    return apiGuard(() async {
      final token = await _storage.readToken();
      if (token == null) return null;
      final res = await _dio.get('/api/auth/get-session');
      final data = res.data;
      if (data == null || data['user'] == null) return null;
      return UserModel.fromJson(data['user'] as Map<String, dynamic>);
    });
  }

  Future<void> signOut() {
    return apiGuard(() async {
      try {
        await _dio.post('/api/auth/sign-out');
      } finally {
        await _storage.deleteToken();
      }
    });
  }

  Future<UserModel> _persistAndParseUser(Response res) async {
    final token = res.headers.value('set-auth-token');
    if (token != null) {
      await _storage.writeToken(token);
    }
    final userJson = res.data['user'] as Map<String, dynamic>;
    return UserModel.fromJson(userJson);
  }
}
