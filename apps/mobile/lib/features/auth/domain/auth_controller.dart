import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/auth_interceptor.dart';
import '../data/auth_repository.dart';
import 'auth_state.dart';

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider));
  ref.listen<int>(authLogoutSignalProvider, (previous, next) {
    if (previous != null && next != previous) {
      controller.forceLogout();
    }
  });
  controller.bootstrap();
  return controller;
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(const AuthState.unknown());

  final AuthRepository _repository;

  Future<void> bootstrap() async {
    try {
      final user = await _repository.getSession();
      state = user == null ? const AuthState.unauthenticated() : AuthState.authenticated(user);
    } on ApiException {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    try {
      final user = await _repository.signIn(email: email, password: password);
      state = AuthState.authenticated(user);
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(e.message);
      rethrow;
    }
  }

  Future<void> signUp({required String name, required String email, required String password}) async {
    try {
      final user = await _repository.signUp(name: name, email: email, password: password);
      state = AuthState.authenticated(user);
    } on ApiException catch (e) {
      state = AuthState.unauthenticated(e.message);
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _repository.signOut();
    state = const AuthState.unauthenticated();
  }

  void forceLogout() {
    state = const AuthState.unauthenticated('Your session expired. Please sign in again.');
  }
}
