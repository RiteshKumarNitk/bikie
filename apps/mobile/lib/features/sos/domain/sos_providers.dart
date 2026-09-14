import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../data/sos_model.dart';
import '../data/sos_repository.dart';

/// GPS fix the caller last shared for the active-alerts list (ADR-042) — mirrors the web
/// client's location gate (`.docs/API.md`: non-admin callers get `400 LOCATION_REQUIRED`
/// without `lat`/`lng`). Replaced a free-text city field: sender and viewer typing their city
/// differently ("Jaipur" vs "jaipur") used to silently hide otherwise-nearby alerts.
///
/// Shared with the Partner dashboard (`partnerLocationProvider` in
/// `partner_dashboard_providers.dart` is a direct alias of this one) — "nearby requests,
/// distance-sorted" is the same concept for a Rider browsing alerts and a Service Provider
/// browsing eligible ones.
final sosActiveAlertsLocationProvider = StateProvider<({double latitude, double longitude})?>((ref) => null);

/// One-shot GPS fix, same permission flow `SosScreen._shareLocation`/`SendSosSheet._captureLocation`
/// already use — factored out so it can also run automatically (no button tap) for a Service
/// Provider, who has no equivalent of the Rider SOS screen's "Share my location" button anywhere
/// in their tab set. Returns `null` (never throws) on a denied/failed permission or a location
/// fetch error — callers decide how to surface that.
Future<({double latitude, double longitude})?> captureOneShotLocation() async {
  try {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      return null;
    }
    final position = await Geolocator.getCurrentPosition();
    return (latitude: position.latitude, longitude: position.longitude);
  } catch (_) {
    return null;
  }
}

final activeSosAlertsProvider = FutureProvider.autoDispose<List<SOSAlert>>((ref) {
  final location = ref.watch(sosActiveAlertsLocationProvider);
  return ref.watch(sosRepositoryProvider).getActive(latitude: location?.latitude, longitude: location?.longitude);
});

/// This rider's own currently-open alert(s), for a "your active SOS alert" Home banner —
/// independent of [sosActiveAlertsLocationProvider], since a rider should see their own alert
/// whether or not they've shared their location for the nearby-community browse list.
final mySosAlertsProvider = FutureProvider.autoDispose<List<SOSAlert>>((ref) {
  return ref.watch(sosRepositoryProvider).getMyActive();
});

final sosHistoryProvider = FutureProvider.autoDispose<List<SOSHistoryEntry>>((ref) {
  return ref.watch(sosRepositoryProvider).getHistory();
});

/// Polls every 5s while an alert's detail screen is open — same reasoning as
/// `conversationThreadProvider`: no bearer-verified SSE on mobile yet (ADR-011/DECISIONS.md).
final sosAlertDetailProvider =
    AsyncNotifierProvider.autoDispose.family<SosAlertDetailNotifier, SOSAlertDetail, String>(
  SosAlertDetailNotifier.new,
);

class SosAlertDetailNotifier extends AutoDisposeFamilyAsyncNotifier<SOSAlertDetail, String> {
  Timer? _timer;

  @override
  Future<SOSAlertDetail> build(String alertId) async {
    ref.onDispose(() => _timer?.cancel());
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _poll(alertId));
    return ref.watch(sosRepositoryProvider).getAlertDetail(alertId);
  }

  Future<void> _poll(String alertId) async {
    try {
      final detail = await ref.read(sosRepositoryProvider).getAlertDetail(alertId);
      state = AsyncData(detail);
    } catch (_) {
      // Silently ignore transient polling failures; next tick retries.
    }
  }

  Future<void> refresh(String alertId) => _poll(alertId);
}

final sosOffersProvider =
    AsyncNotifierProvider.autoDispose.family<SosOffersNotifier, List<SOSOffer>, String>(
  SosOffersNotifier.new,
);

class SosOffersNotifier extends AutoDisposeFamilyAsyncNotifier<List<SOSOffer>, String> {
  Timer? _timer;

  @override
  Future<List<SOSOffer>> build(String alertId) async {
    ref.onDispose(() => _timer?.cancel());
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _poll(alertId));
    return ref.watch(sosRepositoryProvider).listOffers(alertId);
  }

  Future<void> _poll(String alertId) async {
    try {
      final offers = await ref.read(sosRepositoryProvider).listOffers(alertId);
      state = AsyncData(offers);
    } catch (_) {
      // ignore transient failures
    }
  }

  Future<void> refresh(String alertId) => _poll(alertId);
}
