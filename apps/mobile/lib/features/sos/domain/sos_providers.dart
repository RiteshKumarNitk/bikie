import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/sos_model.dart';
import '../data/sos_repository.dart';

/// City the caller last entered for the active-alerts list — mirrors the web's per-city
/// privacy gate (`.docs/API.md`: non-admin callers get `400 CITY_REQUIRED` without one).
final sosActiveAlertsCityProvider = StateProvider<String?>((ref) => null);

final activeSosAlertsProvider = FutureProvider.autoDispose<List<SOSAlert>>((ref) {
  final city = ref.watch(sosActiveAlertsCityProvider);
  return ref.watch(sosRepositoryProvider).getActive(city: city);
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
