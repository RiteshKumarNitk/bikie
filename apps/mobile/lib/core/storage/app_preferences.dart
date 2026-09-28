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
  static const _notificationDenialsKey = 'bikie_notification_permission_denials';
  static const _notificationPromptShownAtKey = 'bikie_notification_prompt_shown_at';

  bool get hasSeenIntro => _prefs.getBool(_hasSeenIntroKey) ?? false;

  Future<void> setHasSeenIntro() => _prefs.setBool(_hasSeenIntroKey, true);

  /// How many times the Android notification-permission dialog has come back denied. Android 13+
  /// stops showing the dialog after the second denial, so from then on only Settings can fix it.
  int get notificationPermissionDenials => _prefs.getInt(_notificationDenialsKey) ?? 0;

  Future<void> recordNotificationPermissionDenied() =>
      _prefs.setInt(_notificationDenialsKey, notificationPermissionDenials + 1);

  Future<void> resetNotificationPermissionDenials() => _prefs.remove(_notificationDenialsKey);

  /// When the in-app "turn on notifications" explanation was last shown, so it isn't repeated
  /// on every launch.
  DateTime? get notificationPromptShownAt {
    final millis = _prefs.getInt(_notificationPromptShownAtKey);
    return millis == null ? null : DateTime.fromMillisecondsSinceEpoch(millis);
  }

  Future<void> setNotificationPromptShownAt(DateTime at) =>
      _prefs.setInt(_notificationPromptShownAtKey, at.millisecondsSinceEpoch);
}
