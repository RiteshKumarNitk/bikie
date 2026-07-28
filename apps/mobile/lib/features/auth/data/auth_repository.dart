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

/// `{ exists, hasRealName }` from `GET /api/auth-helpers/phone-exists`.
typedef PhoneExistsResult = ({bool exists, bool hasRealName});

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
      return _persistAndParseUserFromHeader(res);
    });
  }

  Future<UserModel> signUp({required String name, required String email, required String password}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/auth/sign-up/email',
        data: {'name': name, 'email': email, 'password': password},
      );
      return _persistAndParseUserFromHeader(res);
    });
  }

  /// Better Auth's `phoneNumber` plugin (ADR-013 in `.docs/DECISIONS.md`),
  /// mirroring `authClient.phoneNumber.sendOtp` — no Dart client exists for
  /// this plugin, so this calls the raw REST endpoint directly.
  Future<void> sendOtp(String phoneNumber) {
    return apiGuard(() async {
      await _dio.post('/api/auth/phone-number/send-otp', data: {'phoneNumber': phoneNumber});
    });
  }

  /// Mirrors `authClient.phoneNumber.verify`. Unlike the email routes, the
  /// session token comes back in the JSON body's `token` field (Better
  /// Auth's own documented response shape for this endpoint), not the
  /// `set-auth-token` header — read from there instead.
  Future<UserModel> verifyOtp({required String phoneNumber, required String code}) {
    return apiGuard(() async {
      final res = await _dio.post(
        '/api/auth/phone-number/verify',
        data: {'phoneNumber': phoneNumber, 'code': code},
      );
      final token = res.data['token'] as String?;
      if (token != null) await _storage.writeToken(token);
      return UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
    });
  }

  /// `GET /api/auth-helpers/phone-exists` — unauthenticated by design, used
  /// before sending an OTP to decide whether to show a login or signup path.
  Future<PhoneExistsResult> phoneExists(String phoneNumber) {
    return apiGuard(() async {
      final res = await _dio.get('/api/auth-helpers/phone-exists', queryParameters: {'phone': phoneNumber});
      return (exists: res.data['exists'] as bool, hasRealName: res.data['hasRealName'] as bool);
    });
  }

  /// `PATCH /api/user/complete-phone-signup` — called once, right after a
  /// brand-new phone number's first successful OTP verification, to apply
  /// the role chosen on `/welcome`. Session-authed (the OTP verify call
  /// above already logged the caller in).
  Future<bool> completePhoneSignup({required String role}) {
    return apiGuard(() async {
      final res = await _dio.patch('/api/user/complete-phone-signup', data: {'role': role});
      return res.data['becamePartner'] as bool? ?? false;
    });
  }

  /// Dev-only convenience mirroring the web's `fetchDevOtp` — shows the OTP
  /// without needing a real SMS vendor configured. Best-effort: 404s when
  /// `SHOW_OTP_TOAST=false` server-side, silently ignored either way.
  Future<String?> fetchDevOtp(String phoneNumber) async {
    try {
      final res = await _dio.get('/api/dev/otp', queryParameters: {'phone': phoneNumber});
      return res.data['code'] as String?;
    } catch (_) {
      return null;
    }
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

  Future<UserModel> _persistAndParseUserFromHeader(Response res) async {
    final token = res.headers.value('set-auth-token');
    if (token != null) {
      await _storage.writeToken(token);
    }
    final userJson = res.data['user'] as Map<String, dynamic>;
    return UserModel.fromJson(userJson);
  }
}
