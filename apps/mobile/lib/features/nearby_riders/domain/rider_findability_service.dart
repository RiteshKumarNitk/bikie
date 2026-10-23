import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../sos/domain/sos_providers.dart';
import '../data/nearby_riders_repository.dart';
import 'rider_location_permission.dart';

typedef OneShotLocation = Future<({double latitude, double longitude})?> Function();

/// Keeps "Be findable in an emergency" (`rider_location.sharingEnabled`) actually working in the
/// background instead of silently lapsing. The persisted server-side flag was already correct —
/// the gap was that nothing ever refreshed the location fix after the one pushed at toggle-on, so
/// the existing `rider-location-cleanup` cron (`autoDisableStaleSharing`, 30 min staleness) turned
/// sharing back off on its own well before most sessions ended. This never changes that cron, the
/// SOS eligibility/radius/freshness rules, or the DB flag's meaning — it only (1) keeps pushing
/// fresh fixes often enough that those existing rules see the rider as still active, and (2)
/// restores that behavior automatically on every app start/resume, reading the account's real
/// persisted preference fresh each time rather than ever caching it locally (so logging into a
/// different account on the same device can never inherit the previous one's state).
class RiderFindabilityService {
  RiderFindabilityService(
    this._repository,
    this._permission, {
    OneShotLocation captureFix = captureOneShotLocation,
    Duration refreshInterval = const Duration(minutes: 10),
  })  : _captureFix = captureFix,
        _refreshInterval = refreshInterval;

  final NearbyRidersRepository _repository;
  final RiderLocationPermissionService _permission;
  final OneShotLocation _captureFix;
  final Duration _refreshInterval;

  Timer? _timer;
  bool _restoring = false;

  @visibleForTesting
  bool get isTimerActive => _timer != null;

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
        _stopTimer();
        return;
      }
      final permission = await _permission.check();
      if (permission != RiderLocationPermissionState.granted) {
        _stopTimer();
        return;
      }
      await _pushFreshFix();
      _startTimer();
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

    await _repository.setSharingEnabled(true);
    await _pushFreshFix();
    _startTimer();
    return permission;
  }

  /// The Rider explicitly turned the switch off.
  Future<void> disable() async {
    await _repository.setSharingEnabled(false);
    _stopTimer();
  }

  /// Logout (or forced logout). Never leaks the signed-out account's background refresh into
  /// whatever session comes next on this device.
  void stop() {
    _stopTimer();
  }

  void _startTimer() {
    if (_timer != null) return; // already running — never start a second one
    _timer = Timer.periodic(_refreshInterval, (_) => _pushFreshFix());
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _pushFreshFix() async {
    try {
      // By the time this runs, permission has already been confirmed granted (`enable()`/
      // `restore()` both check first) — `captureOneShotLocation`'s own internal permission check
      // is a no-op pass-through in that case, never a second request.
      final fix = await _captureFix();
      if (fix == null) return;
      await _repository.updateLocation(fix.latitude, fix.longitude);
    } catch (_) {
      // Sharing stays on either way — a fresher fix can land on the next tick; not worth
      // tearing down the timer over one failed GPS read.
    }
  }
}

final riderFindabilityServiceProvider = Provider<RiderFindabilityService>((ref) {
  return RiderFindabilityService(
    ref.watch(nearbyRidersRepositoryProvider),
    ref.watch(riderLocationPermissionServiceProvider),
    captureFix: ref.watch(oneShotLocationProvider),
  );
});

/// Read-only — never requests. Drives the Home-screen row's "permission needed" state when the
/// persisted preference is on but Android's permission has been revoked since.
final riderLocationPermissionStateProvider = FutureProvider.autoDispose<RiderLocationPermissionState>((ref) {
  return ref.watch(riderLocationPermissionServiceProvider).check();
});
