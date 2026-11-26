import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

/// Where the app stands with the Android location permission — mirrors
/// `NotificationPermissionState` (`push/notification_permission.dart`) deliberately, so both
/// permission-gated features read the same way.
enum RiderLocationPermissionState {
  /// `whileInUse` or `always` — a location fix can be read right now.
  granted,

  /// Denied, but the system dialog can still be shown.
  canRequest,

  /// `deniedForever` — only the system Settings screen can turn it on.
  blocked,

  /// Not applicable on this platform.
  unsupported,
}

/// The platform side of the location permission used for rider findability. A separate interface
/// from `NotificationPermissionService` (different OS permission entirely) but the same shape,
/// and for the same reason: screens/services are driven by a fake in tests instead of the real
/// `Geolocator` static calls.
abstract class RiderLocationPermissionService {
  /// Never shows a dialog — a pure read of the current OS state.
  Future<RiderLocationPermissionState> check();

  /// Shows the platform permission dialog if the OS still allows it. Returns the resulting state.
  /// On iOS this only ever requests "When In Use" — `requestAlways()` is the separate, distinct
  /// ask for background tracking specifically (Apple requires When In Use to already be granted
  /// before Always can be requested, and permits only one Always request per install).
  Future<RiderLocationPermissionState> request();

  /// iOS-only escalation from "When In Use" to "Always" — a no-op returning the current state on
  /// Android, where a granted foreground permission already covers this app's foreground-service
  /// background tracking (see AndroidManifest.xml's FOREGROUND_SERVICE_LOCATION comment for why
  /// Android needs no separate background permission here at all).
  Future<RiderLocationPermissionState> requestAlways();

  Future<void> openSystemSettings();
}

/// Cross-platform implementation — `geolocator`'s `checkPermission`/`requestPermission` already
/// work identically on Android and iOS; this was previously gated to Android-only not because of
/// any geolocator limitation, but because Rider findability had no iOS background-tracking use
/// for the "Always" grant yet.
class GeolocatorRiderLocationPermissionService implements RiderLocationPermissionService {
  RiderLocationPermissionState _map(LocationPermission permission) {
    switch (permission) {
      case LocationPermission.whileInUse:
      case LocationPermission.always:
        return RiderLocationPermissionState.granted;
      case LocationPermission.deniedForever:
        return RiderLocationPermissionState.blocked;
      case LocationPermission.denied:
        return RiderLocationPermissionState.canRequest;
      // ignore: unreachable_switch_default
      default:
        return RiderLocationPermissionState.unsupported;
    }
  }

  bool get _supported => Platform.isAndroid || Platform.isIOS;

  @override
  Future<RiderLocationPermissionState> check() async {
    if (!_supported) return RiderLocationPermissionState.unsupported;
    try {
      return _map(await Geolocator.checkPermission());
    } catch (_) {
      return RiderLocationPermissionState.unsupported;
    }
  }

  @override
  Future<RiderLocationPermissionState> request() async {
    if (!_supported) return RiderLocationPermissionState.unsupported;
    try {
      return _map(await Geolocator.requestPermission());
    } catch (_) {
      return check();
    }
  }

  @override
  Future<RiderLocationPermissionState> requestAlways() async {
    if (!Platform.isIOS) return check();
    try {
      // geolocator_apple issues the native "Always" escalation when the Info.plist carries
      // NSLocationAlwaysAndWhenInUseUsageDescription and When In Use is already granted —
      // the same `requestPermission()` call iOS treats differently depending on current state,
      // never a second, separate plugin method.
      return _map(await Geolocator.requestPermission());
    } catch (_) {
      return check();
    }
  }

  @override
  Future<void> openSystemSettings() async {
    await Geolocator.openAppSettings();
  }
}

final riderLocationPermissionServiceProvider = Provider<RiderLocationPermissionService>((ref) {
  return GeolocatorRiderLocationPermissionService();
});
