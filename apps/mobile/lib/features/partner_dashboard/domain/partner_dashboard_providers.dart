import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../onboarding/data/partner_profile_repository.dart';
import '../../sos/domain/sos_providers.dart';
import '../data/partner_dashboard_model.dart';
import '../data/partner_dashboard_repository.dart';

/// Reuses the exact one-shot GPS provider ADR-042 built for "browse nearby SOS alerts" — the
/// same "share your location" concept applies here (nearby requests, distance-sorted), no reason
/// for a second copy.
final partnerLocationProvider = sosActiveAlertsLocationProvider;

/// True once an automatic location capture has genuinely failed (permission denied, or the GPS
/// fetch errored) — lets the UI show "enable location access" instead of the ambiguous "no
/// requests nearby" a `null` location alone can't distinguish from "not captured yet".
final partnerLocationDeniedProvider = StateProvider<bool>((ref) => false);

/// Auto-captures the device's GPS once for a Service Provider, mirroring the web Partner SOS
/// dashboard's `useEffect(() => navigator.geolocation.getCurrentPosition(...), [])` on mount.
///
/// Root cause this exists to fix: the ONLY place in the whole app that ever wrote a value into
/// `sosActiveAlertsLocationProvider` was the Rider-only SOS screen's "Share my location" button
/// (`SosScreen`) — but a Service Provider account's bottom nav has no SOS tab at all (ADR-044:
/// Home/Requests/Active/Messages/Profile, no `/sos`), so that button was structurally
/// unreachable for them. `partnerNearbyRequestsProvider` below short-circuits to an empty list
/// whenever the location is `null`, so every Service Provider's "Requests" tab silently showed
/// "No open requests nearby" regardless of real, eligible, database-backed SOS alerts — there was
/// no code path left that could ever populate their location. Watched (not read) from
/// `PartnerHomeScreen` and `PartnerRequestsScreen` so it fires whether the provider opens the app
/// fresh, taps the Home tab, or deep-links straight into Requests from a push notification.
final partnerLocationBootstrapProvider = FutureProvider.autoDispose<void>((ref) async {
  if (ref.read(partnerLocationProvider) != null) return;
  final location = await captureOneShotLocation();
  if (location != null) {
    ref.read(partnerLocationProvider.notifier).state = location;
    ref.read(partnerLocationDeniedProvider.notifier).state = false;
  } else {
    ref.read(partnerLocationDeniedProvider.notifier).state = true;
  }
});

/// Seeded from `GET /api/partner/profile` (ADR-044's first mobile read of that route) and then
/// updated locally on every successful toggle — avoids a round-trip refetch just to reflect what
/// the user themselves just set.
final partnerAvailabilityProvider = FutureProvider.autoDispose<bool>((ref) async {
  final profile = await ref.watch(partnerProfileRepositoryProvider).getProfile();
  return profile?.isAvailable ?? false;
});

final partnerSosDashboardProvider = FutureProvider.autoDispose<PartnerSosStats>((ref) {
  final location = ref.watch(partnerLocationProvider);
  // Reactive to availability so toggling on/off immediately refreshes "Active Requests" instead
  // of showing a stale count computed while the other state was true.
  ref.watch(partnerAvailabilityProvider);
  return ref.watch(partnerDashboardRepositoryProvider).getStats(
        latitude: location?.latitude,
        longitude: location?.longitude,
      );
});

final partnerNearbyRequestsProvider = FutureProvider.autoDispose<List<PartnerNearbyRequest>>((ref) {
  final location = ref.watch(partnerLocationProvider);
  ref.watch(partnerAvailabilityProvider);
  if (location == null) return Future.value(const []);
  return ref.watch(partnerDashboardRepositoryProvider).getNearbyRequests(
        latitude: location.latitude,
        longitude: location.longitude,
      );
});

final partnerActiveSessionsProvider = FutureProvider.autoDispose<List<PartnerActiveSession>>((ref) {
  return ref.watch(partnerDashboardRepositoryProvider).getActiveAssistance();
});

/// Offers this partner made that the rider hasn't yet accepted/rejected — otherwise invisible
/// once made (excluded from "Nearby Requests" on purpose, not yet in "Active Assistance" since
/// no session exists until the rider accepts).
final partnerPendingOffersProvider = FutureProvider.autoDispose<List<PartnerPendingOffer>>((ref) {
  return ref.watch(partnerDashboardRepositoryProvider).getPendingOffers();
});

/// ADR-046b — "Completed Assistance"/"Assistance History".
final partnerHistoryProvider = FutureProvider.autoDispose<List<PartnerHistorySession>>((ref) {
  return ref.watch(partnerDashboardRepositoryProvider).getHistory();
});
