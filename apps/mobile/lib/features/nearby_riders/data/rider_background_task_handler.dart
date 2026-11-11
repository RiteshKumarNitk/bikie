import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/network/app_config.dart';
import '../../../core/storage/secure_storage.dart';

/// Registers [_RiderBackgroundTrackingHandler] in flutter_foreground_task's own, separate Dart
/// engine/isolate — must stay a top-level function (the plugin calls it by reference across the
/// engine boundary, a closure/instance method can't cross it). `@pragma('vm:entry-point')` keeps
/// the release-build tree-shaker from stripping it, since nothing in the main isolate appears to
/// call it directly.
@pragma('vm:entry-point')
void riderBackgroundTrackingCallback() {
  FlutterForegroundTask.setTaskHandler(_RiderBackgroundTrackingHandler());
}

/// Runs entirely inside the foreground service's own engine — no access to the main isolate's
/// Riverpod container, Dio instance, or in-memory auth state, so it reads the stored bearer token
/// directly via its own [SecureStorage] instance (platform-channel-backed, safe to construct
/// fresh here) and makes its own minimal HTTP call. The token is placed in the Authorization
/// header only — never interpolated into any log line.
///
/// This is the ONLY periodic location push while the Rider's device is on Android — once this
/// service is running, `RiderFindabilityService`'s own foreground-only Dart `Timer` is not also
/// running at the same time (see that file's `enable`/`disable`), so there is exactly one push
/// loop, never two.
class _RiderBackgroundTrackingHandler extends TaskHandler {
  final _secureStorage = SecureStorage(const FlutterSecureStorage());
  final _dio = Dio(
    BaseOptions(
      baseUrl: kApiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    // Intentionally empty — the first push happens on the next onRepeatEvent tick. Pushing here
    // too would duplicate whatever fix `RiderFindabilityService.enable()` already triggered
    // immediately before starting this service.
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    unawaited(_pushFix());
  }

  Future<void> _pushFix() async {
    try {
      final token = await _secureStorage.readToken();
      if (token == null) {
        // Logged out from under this service (should already have been stopped by
        // AuthController.signOut()/forceLogout() — this is the defensive fallback if that
        // somehow didn't happen) — never push with no credentials, and stop self.
        await FlutterForegroundTask.stopService();
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
      );
      await _dio.put(
        '/api/rider-location',
        data: {'latitude': position.latitude, 'longitude': position.longitude},
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
    } catch (_) {
      // Best-effort — mirrors RiderFindabilityService._pushFreshFix exactly: sharing stays on
      // either way, a later tick can succeed; never surfaces anywhere the UI could read it from.
    }
  }

  @override
  Future<void> onDestroy(DateTime timestamp, bool isTimeout) async {}

  @override
  void onReceiveData(Object data) {}

  @override
  void onNotificationButtonPressed(String id) {}

  @override
  void onNotificationPressed() {}

  @override
  void onNotificationDismissed() {}
}
