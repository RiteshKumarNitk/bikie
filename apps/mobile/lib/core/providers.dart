import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'storage/app_preferences.dart';
import 'storage/secure_storage.dart';

final flutterSecureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage(ref.watch(flutterSecureStorageProvider));
});

/// Overridden in `main()` with a real [AppPreferences] wrapping the
/// `SharedPreferences` instance loaded before `runApp` — synchronous access
/// is what lets the router decide `/intro` vs `/welcome` vs `/` on first
/// build without an extra loading state.
final appPreferencesProvider = Provider<AppPreferences>((ref) {
  throw UnimplementedError('appPreferencesProvider must be overridden in main()');
});

/// Seeded from [appPreferencesProvider] at startup; `IntroScreen` flips this
/// (and persists it) once the user finishes/skips the intro carousel, so the
/// router's `redirect` (which watches this) never sends them back to it.
final hasSeenIntroProvider = StateProvider<bool>((ref) => ref.watch(appPreferencesProvider).hasSeenIntro);
