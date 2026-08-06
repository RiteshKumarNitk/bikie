import 'package:flutter/foundation.dart' show debugPrint;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Thin wrapper over [FlutterSecureStorage] for the Better Auth bearer token.
/// See ADR-007 in `.docs/DECISIONS.md`.
class SecureStorage {
  SecureStorage(this._storage);

  final FlutterSecureStorage _storage;

  static const _tokenKey = 'bikie_auth_token';

  /// A corrupted Android Keystore entry (known flutter_secure_storage issue, most likely right
  /// after a reinstall/sideload — the encryption key rotates but the encrypted blob doesn't)
  /// makes `read()` throw instead of returning null. Treated the same as "no token" rather than
  /// left to propagate: `AuthController.bootstrap()` is the only real caller and just needs an
  /// answer, not a crash. Best-effort delete so the same corrupted entry doesn't keep failing on
  /// every future launch.
  Future<String?> readToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (error) {
      debugPrint('[SecureStorage] readToken failed, treating as unauthenticated: $error');
      try {
        await _storage.delete(key: _tokenKey);
      } catch (_) {
        // Best-effort only — nothing more we can do if delete also fails.
      }
      return null;
    }
  }

  Future<void> writeToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> deleteToken() => _storage.delete(key: _tokenKey);
}
