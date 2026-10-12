import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../providers.dart';
import '../storage/app_preferences.dart';
import 'push_registration_service.dart';

/// Where the app stands with the Android notification permission.
enum NotificationPermissionState {
  /// Notifications can be shown.
  granted,

  /// Off, but the system permission dialog can still be shown.
  canRequest,

  /// Off, and Android will no longer show the dialog (denied twice on Android 13+, or turned off
  /// in Settings on Android 12 and below) — only the system Settings screen can turn it on.
  blocked,

  /// Not applicable on this platform (push is Android-only, ADR-035).
  unsupported,
}

/// The platform side of notification permission. An interface so screens and the controller can
/// be driven by a fake in tests.
abstract class NotificationPermissionService {
  Future<NotificationPermissionState> check();

  /// Shows the Android permission dialog if Android still allows it. Returns the resulting state.
  Future<NotificationPermissionState> request();

  /// The app's system settings page, where the user can switch notifications on themselves.
  Future<void> openSystemSettings();
}

/// Android 13+ (API 33) makes `POST_NOTIFICATIONS` a runtime permission: a fresh install shows
/// "Notifications: Blocked" in App info until the user answers the dialog. Android 12 and below
/// grant it at install time and there is no dialog to show.
class AndroidNotificationPermissionService implements NotificationPermissionService {
  AndroidNotificationPermissionService(this._prefs);

  final AppPreferences _prefs;
  int? _sdkInt;

  Future<int> _sdk() async => _sdkInt ??= (await DeviceInfoPlugin().androidInfo).version.sdkInt;

  Future<bool> _enabled() async {
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  @override
  Future<NotificationPermissionState> check() async {
    if (!Platform.isAndroid) return NotificationPermissionState.unsupported;
    try {
      if (await _enabled()) {
        // Re-granted (e.g. from Settings) — a later revoke gets the dialog again.
        if (_prefs.notificationPermissionDenials > 0) await _prefs.resetNotificationPermissionDenials();
        return NotificationPermissionState.granted;
      }
      if (await _sdk() < 33) return NotificationPermissionState.blocked;
      return _prefs.notificationPermissionDenials >= 2
          ? NotificationPermissionState.blocked
          : NotificationPermissionState.canRequest;
    } catch (_) {
      return NotificationPermissionState.unsupported;
    }
  }

  @override
  Future<NotificationPermissionState> request() async {
    final before = await check();
    if (before != NotificationPermissionState.canRequest) return before;
    try {
      final settings = await FirebaseMessaging.instance.requestPermission(alert: true, badge: true, sound: true);
      if (settings.authorizationStatus != AuthorizationStatus.authorized &&
          settings.authorizationStatus != AuthorizationStatus.provisional) {
        await _prefs.recordNotificationPermissionDenied();
      }
    } catch (_) {
      // Fall through to a fresh check — never let a plugin failure break the caller.
    }
    return check();
  }

  @override
  Future<void> openSystemSettings() async {
    // App info page — "Notifications" is one tap from there on every Android version.
    await Geolocator.openAppSettings();
  }
}

final notificationPermissionServiceProvider = Provider<NotificationPermissionService>((ref) {
  return AndroidNotificationPermissionService(ref.watch(appPreferencesProvider));
});

/// Current notification permission state; `null` until first checked. Re-check with [refresh]
/// (e.g. when the app returns from Settings). Whenever it becomes [granted], the FCM token is
/// (re-)registered so pushes start arriving without needing a restart.
final notificationPermissionProvider =
    StateNotifierProvider<NotificationPermissionController, NotificationPermissionState?>((ref) {
  return NotificationPermissionController(
    ref.watch(notificationPermissionServiceProvider),
    ref.watch(pushRegistrationServiceProvider),
  )..refresh();
});

class NotificationPermissionController extends StateNotifier<NotificationPermissionState?> {
  NotificationPermissionController(this._service, this._push) : super(null);

  final NotificationPermissionService _service;
  final PushRegistrationService _push;

  Future<NotificationPermissionState> refresh() => _update(_service.check());

  Future<NotificationPermissionState> request() => _update(_service.request());

  Future<void> openSystemSettings() => _service.openSystemSettings();

  Future<NotificationPermissionState> _update(Future<NotificationPermissionState> next) async {
    final previous = state;
    final result = await next;
    if (!mounted) return result;
    state = result;
    if (result == NotificationPermissionState.granted && previous != NotificationPermissionState.granted) {
      await _push.registerForCurrentUser();
    }
    return result;
  }
}
