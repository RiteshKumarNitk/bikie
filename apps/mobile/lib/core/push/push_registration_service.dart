import 'dart:async';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'push_token_repository.dart';

final pushRegistrationServiceProvider = Provider<PushRegistrationService>((ref) {
  return PushRegistrationService(ref.watch(pushTokenRepositoryProvider));
});

/// Obtains an FCM token and registers it against the existing push-token route — called right
/// after a successful login/signup/OTP-verify/session-bootstrap (ADR-035), and again whenever
/// notification permission becomes granted. Also re-registers on token refresh (FCM rotates
/// tokens occasionally) and removes the token on logout. iOS is explicitly out of scope for this
/// pass — every method below is a no-op on any non-Android platform.
///
/// Does NOT ask for notification permission. That used to happen here, silently, as a side effect
/// of login — the dialog appeared with no explanation while the app was navigating (and, for a new
/// Service Provider, at the same moment as the location dialog), and if it was dismissed nothing
/// ever asked again. Permission is now requested deliberately, with an explanation
/// (`notification_permission.dart` / `NotificationPermissionPrompt`). The token is registered
/// regardless: an FCM token is valid while notifications are off, so the moment the user turns
/// them on, pushes arrive — no restart or re-login needed.
class PushRegistrationService {
  PushRegistrationService(this._repository);

  final PushTokenRepository _repository;
  StreamSubscription<String>? _refreshSub;
  bool _registered = false;

  Future<void> registerForCurrentUser() async {
    if (!Platform.isAndroid || _registered) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      await _register(token);
      // Only once it actually succeeded — a failed attempt is retried on the next call.
      _registered = true;
      _refreshSub ??= FirebaseMessaging.instance.onTokenRefresh.listen(_register);
    } catch (_) {
      // Push registration is a best-effort enhancement — it must never break login.
    }
  }

  Future<void> _register(String token) async {
    var deviceId = 'unknown';
    String? deviceName;
    try {
      final android = await DeviceInfoPlugin().androidInfo;
      deviceId = android.id;
      deviceName = '${android.manufacturer} ${android.model}'.trim();
    } catch (_) {
      // Fall back to the generic deviceId above — registration still proceeds.
    }
    final packageInfo = await PackageInfo.fromPlatform();
    await _repository.register(
      token: token,
      deviceId: deviceId,
      deviceName: deviceName,
      appVersion: '${packageInfo.version}+${packageInfo.buildNumber}',
    );
  }

  Future<void> unregisterCurrentDevice() async {
    if (!Platform.isAndroid) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _repository.unregister(token);
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {
      // Logout must never hang/fail on push cleanup.
    }
    await _refreshSub?.cancel();
    _refreshSub = null;
    _registered = false;
  }
}
