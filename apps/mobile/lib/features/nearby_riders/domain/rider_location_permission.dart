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

/// The platform side of the Android location permission used for rider findability. A separate
/// interface from `NotificationPermissionService` (different OS permission entirely) but the same
/// shape, and for the same reason: screens/services are driven by a fake in tests instead of the
/// real `Geolocator` static calls.
abstract class RiderLocationPermissionService {
  /// Never shows a dialog — a pure read of the current OS state.
  Future<RiderLocationPermissionState> check();

  /// Shows the Android permission dialog if Android still allows it. Returns the resulting state.
  Future<RiderLocationPermissionState> request();

  Future<void> openSystemSettings();
}

class AndroidRiderLocationPermissionService implements RiderLocationPermissionService {
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

  @override
  Future<RiderLocationPermissionState> check() async {
    if (!Platform.isAndroid) return RiderLocationPermissionState.unsupported;
    try {
      return _map(await Geolocator.checkPermission());
    } catch (_) {
      return RiderLocationPermissionState.unsupported;
    }
  }

  @override
  Future<RiderLocationPermissionState> request() async {
    if (!Platform.isAndroid) return RiderLocationPermissionState.unsupported;
    try {
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
  return AndroidRiderLocationPermissionService();
});
