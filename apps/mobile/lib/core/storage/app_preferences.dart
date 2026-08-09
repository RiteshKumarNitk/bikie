import 'package:shared_preferences/shared_preferences.dart';

/// Non-secret, device-local UI preferences — distinct from [SecureStorage],
/// which is reserved for the bearer auth token. First-launch intro/onboarding
/// gate, plus (ADR-046b) the dual-capability "active mode" switch — mirrors
/// web's `selectedRole` cookie, just persisted device-side instead of via
/// Set-Cookie since there's no middleware layer here to own it.
class AppPreferences {
  AppPreferences(this._prefs);

  final SharedPreferences _prefs;

  static const _hasSeenIntroKey = 'bikie_has_seen_intro';
  static const _activeModeKey = 'bikie_active_mode';

  bool get hasSeenIntro => _prefs.getBool(_hasSeenIntroKey) ?? false;

  Future<void> setHasSeenIntro() => _prefs.setBool(_hasSeenIntroKey, true);

  /// `'RIDER' | 'PARTNER' | null` (no preference recorded yet). Never trusted for
  /// authorization by itself — every server call re-checks `partnerStatus`; this only decides
  /// which screens the app renders.
  String? get activeMode => _prefs.getString(_activeModeKey);

  Future<void> setActiveMode(String mode) => _prefs.setString(_activeModeKey, mode);
}
