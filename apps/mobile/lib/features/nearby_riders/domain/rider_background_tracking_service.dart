import 'dart:async';
import 'dart:io';

import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../data/nearby_riders_repository.dart';
import '../data/rider_background_task_handler.dart';

/// Owns the one OS-level background tracking mechanism for Rider "Be findable" — a real Android
/// foreground service (`flutter_foreground_task`, its own Dart engine — see
/// `rider_background_task_handler.dart`) on Android, and a background-capable `geolocator`
/// position stream kept in THIS (the main) isolate on iOS — iOS keeps the whole app process alive
/// via its own `UIBackgroundModes: location` grant once "Always" is authorized, so no second
/// engine is needed there, unlike Android.
///
/// `RiderFindabilityService` is the only caller. This class only ever answers "is OS-level
/// tracking running" and starts/stops it — it never reads or writes the backend's persisted
/// `sharingEnabled` preference itself, keeping that single source of truth exactly where it
/// already lived.
class RiderBackgroundTrackingService {
  RiderBackgroundTrackingService(this._repository);

  final NearbyRidersRepository _repository;

  StreamSubscription<Position>? _iosSubscription;
  DateTime? _lastIosPush;
  bool _androidInitialized = false;

  Future<bool> get isRunning async =>
      Platform.isAndroid ? await FlutterForegroundTask.isRunningService : _iosSubscription != null;

  void _ensureAndroidInitialized() {
    if (_androidInitialized) return;
    _androidInitialized = true;
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'rider_be_findable',
        channelName: 'Be Findable',
        channelDescription: 'Shown while "Be findable in an emergency" is turned on.',
        onlyAlertOnce: true,
      ),
      iosNotificationOptions: const IOSNotificationOptions(showNotification: false, playSound: false),
      foregroundTaskOptions: ForegroundTaskOptions(
        // Matches the existing 10-minute interval RiderFindabilityService already used in the
        // foreground-only Dart timer this supersedes — not a new, tighter polling rate.
        eventAction: ForegroundTaskEventAction.repeat(600000),
        // Both false, deliberately: this service is started only from an explicit foreground
        // action (the Rider's own toggle, or `restore()` on app launch/login finding the saved
        // preference already ON) — never silently resurrected by the OS on its own. See the
        // matching comment on FOREGROUND_SERVICE_LOCATION in AndroidManifest.xml.
        autoRunOnBoot: false,
        autoRunOnMyPackageReplaced: false,
        allowWakeLock: true,
        allowWifiLock: false,
      ),
    );
  }

  /// No-op if already running — belt-and-suspenders against ever running two instances, on top
  /// of `RiderFindabilityService`'s own re-entrancy guard (Android: flutter_foreground_task's own
  /// `isRunningService`; iOS: the subscription field itself).
  Future<void> start() async {
    if (await isRunning) return;
    if (Platform.isAndroid) {
      _ensureAndroidInitialized();
      await FlutterForegroundTask.startService(
        serviceId: 9100,
        notificationTitle: 'BIKIE — Be Findable is on',
        notificationText: "Sharing your location so nearby Riders can find you in an emergency.",
        callback: riderBackgroundTrackingCallback,
      );
    } else if (Platform.isIOS) {
      _iosSubscription = Geolocator.getPositionStream(
        locationSettings: AppleSettings(
          accuracy: LocationAccuracy.medium,
          pauseLocationUpdatesAutomatically: false,
          showBackgroundLocationIndicator: true,
          allowBackgroundLocationUpdates: true,
        ),
      ).listen(_onIosPosition, onError: (_) {});
    }
  }

  Future<void> stop() async {
    if (Platform.isAndroid) {
      if (await FlutterForegroundTask.isRunningService) {
        await FlutterForegroundTask.stopService();
      }
    } else {
      await _iosSubscription?.cancel();
      _iosSubscription = null;
      _lastIosPush = null;
    }
  }

  /// iOS delivers a position update on the stream's own (OS-throttled) cadence regardless of
  /// `distanceFilter` — rate-limited here to roughly the same 10-minute interval Android's service
  /// and the pre-existing foreground-only timer both used, rather than pushing on every delta.
  void _onIosPosition(Position position) {
    final now = DateTime.now();
    if (_lastIosPush != null && now.difference(_lastIosPush!) < const Duration(minutes: 10)) return;
    _lastIosPush = now;
    unawaited(_pushIosFix(position));
  }

  Future<void> _pushIosFix(Position position) async {
    try {
      await _repository.updateLocation(position.latitude, position.longitude);
    } catch (_) {
      // Best-effort — same reasoning as the Android handler and the pre-existing
      // RiderFindabilityService._pushFreshFix: sharing stays on either way.
    }
  }
}

final riderBackgroundTrackingServiceProvider = Provider<RiderBackgroundTrackingService>((ref) {
  return RiderBackgroundTrackingService(ref.watch(nearbyRidersRepositoryProvider));
});
