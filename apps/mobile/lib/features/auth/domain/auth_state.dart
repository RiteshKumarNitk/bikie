import '../data/user_model.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({required this.status, this.user, this.error});

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.authenticated(UserModel user) : this(status: AuthStatus.authenticated, user: user);
  const AuthState.unauthenticated([String? error]) : this(status: AuthStatus.unauthenticated, error: error);

  final AuthStatus status;
  final UserModel? user;
  final String? error;

  bool get isAuthenticated => status == AuthStatus.authenticated;
}
