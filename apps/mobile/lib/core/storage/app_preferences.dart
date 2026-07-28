import 'package:shared_preferences/shared_preferences.dart';

/// Non-secret, device-local UI preferences — distinct from [SecureStorage],
/// which is reserved for the bearer auth token. Currently just the
/// first-launch intro/onboarding gate.
class AppPreferences {
  AppPreferences(this._prefs);

  final SharedPreferences _prefs;

  static const _hasSeenIntroKey = 'bikie_has_seen_intro';

  bool get hasSeenIntro => _prefs.getBool(_hasSeenIntroKey) ?? false;

  Future<void> setHasSeenIntro() => _prefs.setBool(_hasSeenIntroKey, true);
}
