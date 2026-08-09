import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/nearby_riders_model.dart';
import '../data/nearby_riders_repository.dart';

final sharingEnabledProvider = FutureProvider.autoDispose<bool>((ref) {
  return ref.watch(nearbyRidersRepositoryProvider).getSharingEnabled();
});

/// ADR-045 — independent toggle from `sharingEnabledProvider`: whether this rider receives SOS
/// dispatch pings at all.
final receiveSosAlertsProvider = FutureProvider.autoDispose<bool>((ref) {
  return ref.watch(nearbyRidersRepositoryProvider).getReceiveSosAlerts();
});

final radiusKmProvider = StateProvider<int>((ref) => 5);

final nearbyRidersProvider = FutureProvider.autoDispose<List<NearbyRider>>((ref) {
  final radiusKm = ref.watch(radiusKmProvider);
  // Re-fetch whenever sharing toggles, since turning sharing on/off changes whether this
  // search can return anything at all (self-join reciprocity — see the repository).
  ref.watch(sharingEnabledProvider);
  return ref.watch(nearbyRidersRepositoryProvider).findNearby(radiusKm: radiusKm);
});
