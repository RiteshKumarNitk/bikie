import 'package:shared_preferences/shared_preferences.dart';

/// Non-secret, device-local UI preferences — distinct from [SecureStorage],
/// which is reserved for the bearer auth token. First-launch intro/onboarding
/// gate. (ADR-053: the dual-capability "active mode" device preference this class
/// used to also hold was removed along with the model it belonged to — a signed-in
/// account's tab set now comes straight from the server-authoritative
/// `UserModel.accountType`, nothing left to persist locally.)
class AppPreferences {
  AppPreferences(this._prefs);

  final SharedPreferences _prefs;

  static const _hasSeenIntroKey = 'bikie_has_seen_intro';

  bool get hasSeenIntro => _prefs.getBool(_hasSeenIntroKey) ?? false;

  Future<void> setHasSeenIntro() => _prefs.setBool(_hasSeenIntroKey, true);
}
