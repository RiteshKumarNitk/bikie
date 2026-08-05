import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/auth_interceptor.dart';
import '../../../core/push/push_registration_service.dart';
import '../data/auth_repository.dart';
import 'auth_state.dart';

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider), ref.watch(pushRegistrationServiceProvider));
  ref.listen<int>(authLogoutSignalProvider, (previous, next) {
    if (previous != null && next != previous) {
      controller.forceLogout();
    }
  });
  controller.bootstrap();
  return controller;
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository, this._push) : super(const AuthState.unknown());

  final AuthRepository _repository;
  final PushRegistrationService _push;

  Future<void> bootstrap() async {
    try {
      final user = await _repository.getSession();
      if (user == null) {
        state = const AuthState.unauthenticated();
      } else {
        state = AuthState.authenticated(user);
        unawaited(_push.registerForCurrentUser());
      }
    } on ApiException {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    try {
      final user = await _repository.signIn(email: email, password: password);
      state = AuthState.authenticated(user);
      unawaited(_push.registerForCurrentUser());
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(e.message);
      rethrow;
    }
  }

  Future<void> signUp({required String name, required String email, required String password}) async {
    try {
      final user = await _repository.signUp(name: name, email: email, password: password);
      state = AuthState.authenticated(user);
      unawaited(_push.registerForCurrentUser());
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(e.message);
      rethrow;
    }
  }

  /// Establishes a session from a verified OTP. Left un-caught on failure
  /// (state stays unauthenticated) — the caller (the OTP entry screen) shows
  /// its own inline error, same as the web's local `serverError` state.
  Future<void> verifyOtp({required String phoneNumber, required String code}) async {
    final user = await _repository.verifyOtp(phoneNumber: phoneNumber, code: code);
    state = AuthState.authenticated(user);
    unawaited(_push.registerForCurrentUser());
  }

  Future<void> signOut() async {
    await _push.unregisterCurrentDevice();
    await _repository.signOut();
    state = const AuthState.unauthenticated();
  }

  void forceLogout() {
    unawaited(_push.unregisterCurrentDevice());
    state = const AuthState.unauthenticated('Your session expired. Please sign in again.');
  }
}
