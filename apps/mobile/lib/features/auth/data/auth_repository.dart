import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_guard.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/providers.dart';
import '../../../core/storage/secure_storage.dart';
import 'msg91_otp_repository.dart';
import 'user_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider), ref.watch(secureStorageProvider));
});

/// Result of [AuthRepository.sendOtp] — `reqId` is set only on the MSG91-Widget (release) path;
/// null on the debug-only backend-proxied path, where [AuthRepository.verifyOtp] doesn't need one.
class OtpSendResult {
  const OtpSendResult({this.reqId});
  final String? reqId;
}

/// `{ exists, hasRealName, accountType }` from `GET /api/auth-helpers/phone-exists`.
/// ADR-053 — `accountType` ('RIDER' | 'SERVICE_PROVIDER') is null when `exists` is false; lets
/// the caller catch a Rider-vs-Service-Provider mismatch before ever sending an OTP.
typedef PhoneExistsResult = ({bool exists, bool hasRealName, String? accountType});

class AuthRepository {
  AuthRepository(this._dio, this._storage);

  final Dio _dio;
  final SecureStorage _storage;
  final Msg91OtpRepository _msg91 = Msg91OtpRepository();

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

  /// ADR-057 — release builds use MSG91's OTP Widget SDK directly (`Msg91OtpRepository`),
  /// mirroring web exactly: the app talks to MSG91 itself, our backend never sees the send leg,
  /// only the final access token at verify time. Debug builds keep the older backend-proxied
  /// native-API path (ADR-034) unchanged, specifically to preserve the dev-bypass and
  /// `TEST_RIDER_PHONE`/`TEST_SERVICE_PROVIDER_PHONE` fixed-code mechanisms — MSG91's real widget
  /// would reject a fake test code before our backend ever saw it, so those two flows can't share
  /// one code path (see `Msg91OtpRepository`'s doc comment for the full reasoning).
  Future<OtpSendResult> sendOtp(String phoneNumber, {OtpChannel channel = OtpChannel.sms}) {
    if (kDebugMode) {
      return apiGuard(() async {
        await _dio.post('/api/otp/mobile/send', data: {'phoneNumber': phoneNumber});
        return const OtpSendResult();
      });
    }
    return apiGuard(() async {
      final result = await _msg91.sendOtp(phoneNumber, channel: channel);
      return OtpSendResult(reqId: result.reqId);
    });
  }

  /// Resends the OTP on the given [channel]. In debug mode this is just a fresh
  /// `sendOtp` call (MSG91's native API treats a repeat send as a resend for the same number);
  /// in release mode it's a real MSG91 `retryOTP` against the session `reqId` from the original
  /// send — [reqId] must be non-null on that path (the caller's responsibility to track it,
  /// same as web's `use-msg91-widget.ts` tracks widget session state internally).
  Future<void> resendOtp(String phoneNumber, {String? reqId, OtpChannel channel = OtpChannel.sms}) {
    if (kDebugMode) {
      return apiGuard(() async {
        await _dio.post('/api/otp/mobile/send', data: {'phoneNumber': phoneNumber});
      });
    }
    if (reqId == null) {
      throw ArgumentError('reqId is required to resend an OTP outside debug mode.');
    }
    return apiGuard(() => _msg91.retryOtp(reqId, channel: channel));
  }

  /// Mirrors `authClient.phoneNumber.verify` — unchanged by ADR-034/057, still the one shared
  /// verify path for both platforms and both send flows (Better Auth's `verifyOTP` hook asks
  /// MSG91 instead of comparing its own code, and discriminates a plain numeric native-API code
  /// from an MSG91-widget access token purely by shape — see
  /// `packages/services/.../otp-verify.application.ts`'s `NATIVE_OTP_SHAPE`). The session token
  /// comes back in the JSON body's `token` field (Better Auth's own documented response shape for
  /// this endpoint), not the `set-auth-token` header — read from there instead.
  ///
  /// [reqId] non-null means the release/widget send path was used: [code] is first verified
  /// against MSG91 directly (`Msg91OtpRepository.verifyOtp`), and its resulting access token —
  /// not the user-typed digits — is what actually gets sent to our backend below. `reqId: null`
  /// (debug mode) sends the user-typed code straight through unchanged, exactly as before ADR-057.
  Future<UserModel> verifyOtp({required String phoneNumber, required String code, String? reqId}) {
    return apiGuard(() async {
      final verifiedCode = reqId != null ? await _msg91.verifyOtp(reqId, code) : code;
      final res = await _dio.post(
        '/api/auth/phone-number/verify',
        data: {'phoneNumber': phoneNumber, 'code': verifiedCode},
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
      return (
        exists: res.data['exists'] as bool,
        hasRealName: res.data['hasRealName'] as bool,
        accountType: res.data['accountType'] as String?,
      );
    });
  }

  /// `PATCH /api/user/complete-phone-signup` — called once, right after a
  /// brand-new phone number's first successful OTP verification, to apply
  /// the role chosen on `/welcome`. Session-authed (the OTP verify call
  /// above already logged the caller in).
  /// ADR-053 — `accountType` ('RIDER' | 'SERVICE_PROVIDER') is applied server-side only for a
  /// brand-new account, within a short window of creation (see `UserService.completePhoneSignup`
  /// on the backend) — this can never become a self-service switch against an existing account.
  Future<void> completePhoneSignup({required String accountType}) {
    return apiGuard(() async {
      await _dio.patch('/api/user/complete-phone-signup', data: {'accountType': accountType});
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

  /// Better Auth's core `update-user` endpoint (mirrors `authClient.updateUser`) — no Dart
  /// client exists for it, same rationale as `sendOtp`/`verifyOtp` above. Used by the
  /// onboarding screens to replace the phone-number placeholder name (and optionally set a
  /// photo) once the user actually supplies one; Better Auth ignores absent fields, so only
  /// non-null values are sent.
  Future<void> updateUser({String? name, String? image}) {
    return apiGuard(() async {
      final data = <String, dynamic>{
        if (name != null && name.isNotEmpty) 'name': name,
        if (image != null && image.isNotEmpty) 'image': image,
      };
      if (data.isEmpty) return;
      await _dio.post('/api/auth/update-user', data: data);
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

  Future<UserModel> _persistAndParseUserFromHeader(Response res) async {
    final token = res.headers.value('set-auth-token');
    if (token != null) {
      await _storage.writeToken(token);
    }
    final userJson = res.data['user'] as Map<String, dynamic>;
    return UserModel.fromJson(userJson);
  }
}
