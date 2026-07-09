import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/secure_storage.dart';

/// Bumped by [AuthInterceptor] whenever a request comes back 401, so the
/// auth feature (which depends on `core`, never the reverse) can react by
/// clearing its in-memory session state. See ADR-007 in `.docs/DECISIONS.md`.
final authLogoutSignalProvider = StateProvider<int>((ref) => 0);

/// Attaches the stored bearer token to every request except the auth
/// endpoints themselves, and clears it on a 401.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._storage, this._ref);

  final SecureStorage _storage;
  final Ref _ref;

  static const _unauthenticatedPaths = ['/api/auth/sign-in/email', '/api/auth/sign-up/email'];

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final isAuthEndpoint = _unauthenticatedPaths.any((p) => options.path.contains(p));
    if (!isAuthEndpoint) {
      final token = await _storage.readToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      await _storage.deleteToken();
      _ref.read(authLogoutSignalProvider.notifier).state++;
    }
    handler.next(err);
  }
}
