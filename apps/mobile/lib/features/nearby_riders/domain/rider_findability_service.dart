import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../sos/domain/sos_providers.dart';
import '../data/nearby_riders_repository.dart';
import 'rider_background_tracking_service.dart';
import 'rider_location_permission.dart';

typedef OneShotLocation = Future<({double latitude, double longitude})?> Function();

/// Keeps "Be findable in an emergency" (`rider_location.sharingEnabled`) actually working while
/// the app is backgrounded/screen-locked instead of silently lapsing, via a real OS-level
/// mechanism (`RiderBackgroundTrackingService` — an Android foreground service / an iOS
/// background-capable position stream), not just a foreground-only Dart timer. The persisted
/// server-side flag remains the single source of truth either way — this never changes the
/// `rider-location-cleanup` cron (now a deliberate no-op — see
/// `packages/database/.../rider-location.repository.ts`), the SOS eligibility/radius/freshness
/// rules, or the DB flag's meaning; it only (1) keeps pushing fresh fixes often enough that those
/// existing rules see the rider as still active, now genuinely including while backgrounded, and
/// (2) restores that behavior automatically on every app start/resume, reading the account's real
/// persisted preference fresh each time rather than ever caching it locally (so logging into a
/// different account on the same device can never inherit the previous one's state).
class RiderFindabilityService {
  RiderFindabilityService(
    this._repository,
    this._permission,
    this._backgroundTracking, {
    OneShotLocation captureFix = captureOneShotLocation,
  }) : _captureFix = captureFix;

  final NearbyRidersRepository _repository;
  final RiderLocationPermissionService _permission;
  final RiderBackgroundTrackingService _backgroundTracking;
  final OneShotLocation _captureFix;

  bool _restoring = false;
  bool _trackingActive = false;

  /// Whether this service currently believes OS-level background tracking is running — mirrors
  /// `_backgroundTracking.isRunning` (the actual source of truth) but kept as a plain sync `bool`
  /// here since `start()`/`stop()` already await it; avoids every call site needing to be async
  /// just to read this back in tests.
  @visibleForTesting
  bool get isTrackingActive => _trackingActive;

  /// Called after login/signup/OTP-verify/bootstrap, and again whenever the app resumes
  /// (`RiderFindabilityGate`). Reads the signed-in account's persisted preference fresh every
  /// time — if it's on and Android still grants the permission, pushes a fix and (re)starts the
  /// periodic refresh, entirely silently: no prompt, matching "reopening the app must not ask the
  /// Rider to enable the setting again." Never requests permission itself (that's `enable()`'s
  /// job, a deliberate user action) — if permission is missing, this leaves the timer stopped and
  /// the setting untouched; the UI surfaces the permission gap separately
  /// (`riderLocationPermissionStateProvider`), since a persisted `true` must never be read as
  /// license to bypass Android's own permission state.
  Future<void> restore() async {
    if (_restoring) return;
    _restoring = true;
    try {
      final enabled = await _repository.getSharingEnabled();
      if (!enabled) {
        await _stopTracking();
        return;
      }
      final permission = await _permission.check();
      if (permission != RiderLocationPermissionState.granted) {
        await _stopTracking();
        return;
      }
      await _pushFreshFix();
      await _startTracking();
    } catch (_) {
      // Best-effort — the next resume or periodic tick tries again; a transient failure here
      // must never surface as an error to the caller (auth bootstrap, app resume).
    } finally {
      _restoring = false;
    }
  }

  /// The Rider explicitly turned the switch on. Unlike `restore()`, this may show the Android
  /// permission dialog — it's a direct result of the tap that just happened, not a repeat ask.
  /// Returns the resulting permission state so the caller can show its own message when it's
  /// still not granted (callers already have their own copy for this).
  Future<RiderLocationPermissionState> enable() async {
    var permission = await _permission.check();
    if (permission == RiderLocationPermissionState.canRequest) {
      permission = await _permission.request();
    }
    if (permission != RiderLocationPermissionState.granted) return permission;

    // iOS only, best-effort: escalates "When In Use" to "Always" for background tracking
    // specifically. Never blocks on the result — `RiderLocationPermissionState.granted` doesn't
    // distinguish the two, so a Rider who only grants "While Using" still gets everything this
    // service can offer within that (foreground pushes, resume-triggered refresh); the
    // background stream itself simply stops delivering once backgrounded, which iOS enforces on
    // its own, not something this call needs to detect or report.
    if (Platform.isIOS) await _permission.requestAlways();

    await _repository.setSharingEnabled(true);
    await _pushFreshFix();
    await _startTracking();
    return permission;
  }

  /// The Rider explicitly turned the switch off. Stops background tracking immediately — never
  /// leaves the foreground service/iOS stream running a moment longer than the saved preference
  /// says it should.
  Future<void> disable() async {
    await _repository.setSharingEnabled(false);
    await _stopTracking();
  }

  /// Logout (or forced logout). Never leaks the signed-out account's background tracking into
  /// whatever session comes next on this device. Kept synchronous (matching `AuthController`'s
  /// existing un-awaited call site) — `isTrackingActive` flips immediately so a session swap right
  /// after logout is never seen as still-active, while the actual plugin teardown runs best-effort
  /// in the background without blocking sign-out.
  void stop() {
    _trackingActive = false;
    unawaited(_backgroundTracking.stop());
  }

  /// Guards against ever running two tracking mechanisms at once — belt-and-suspenders on top of
  /// `RiderBackgroundTrackingService.start()`'s own `isRunning` check.
  Future<void> _startTracking() async {
    if (_trackingActive) return;
    await _backgroundTracking.start();
    _trackingActive = true;
  }

  Future<void> _stopTracking() async {
    await _backgroundTracking.stop();
    _trackingActive = false;
  }

  /// The one immediate push at enable/restore time, before background tracking's own periodic
  /// loop has had a chance to tick — gives the Rider's freshness an instant head start instead of
  /// waiting up to a full interval for the first update.
  Future<void> _pushFreshFix() async {
    try {
      // By the time this runs, permission has already been confirmed granted (`enable()`/
      // `restore()` both check first) — `captureOneShotLocation`'s own internal permission check
      // is a no-op pass-through in that case, never a second request.
      final fix = await _captureFix();
      if (fix == null) return;
      await _repository.updateLocation(fix.latitude, fix.longitude);
    } catch (_) {
      // Sharing stays on either way — background tracking's own next tick can still succeed.
    }
  }
}

final riderFindabilityServiceProvider = Provider<RiderFindabilityService>((ref) {
  return RiderFindabilityService(
    ref.watch(nearbyRidersRepositoryProvider),
    ref.watch(riderLocationPermissionServiceProvider),
    ref.watch(riderBackgroundTrackingServiceProvider),
    captureFix: ref.watch(oneShotLocationProvider),
  );
});

/// Read-only — never requests. Drives the Home-screen row's "permission needed" state when the
/// persisted preference is on but Android's permission has been revoked since.
final riderLocationPermissionStateProvider = FutureProvider.autoDispose<RiderLocationPermissionState>((ref) {
  return ref.watch(riderLocationPermissionServiceProvider).check();
});
