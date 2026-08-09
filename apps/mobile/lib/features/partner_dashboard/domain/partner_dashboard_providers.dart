import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../onboarding/data/partner_profile_repository.dart';
import '../../sos/domain/sos_providers.dart';
import '../data/partner_dashboard_model.dart';
import '../data/partner_dashboard_repository.dart';

/// Reuses the exact one-shot GPS provider ADR-042 built for "browse nearby SOS alerts" — the
/// same "share your location" concept applies here (nearby requests, distance-sorted), no reason
/// for a second copy.
final partnerLocationProvider = sosActiveAlertsLocationProvider;

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
