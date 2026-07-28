import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/trip_models.dart';
import '../data/trip_repository.dart';

const tripTabs = ['upcoming', 'weekend', 'adventure', 'road-trip', 'international', 'guided-tour', 'completed'];

/// Ride creation only accepts these 5 (see `createTripSchema` in
/// `packages/validation/src/trip.schema.ts`) — `EVENT` exists as a `TripType`
/// value but is admin-only (ADR-011), not user-creatable.
const rideCreationTypes = ['WEEKEND', 'ADVENTURE', 'ROAD_TRIP', 'INTERNATIONAL', 'GUIDED_TOUR'];
const rideDifficulties = ['EASY', 'MODERATE', 'HARD'];

final tripTabProvider = StateProvider.autoDispose<String>((ref) => 'upcoming');

final tripsProvider = FutureProvider.autoDispose<List<TripSummary>>((ref) {
  final tab = ref.watch(tripTabProvider);
  return ref.watch(tripRepositoryProvider).getAll(tab: tab);
});

final tripDetailProvider = FutureProvider.autoDispose.family<TripDetail, String>((ref, slug) {
  return ref.watch(tripRepositoryProvider).getBySlug(slug);
});

/// `GET /api/trips/mine` — organized/joined/requested rides + reputation stats.
final myRidesProvider = FutureProvider.autoDispose<MyRides>((ref) {
  return ref.watch(tripRepositoryProvider).getMine();
});

/// Organizer's pending-request queue for a single ride.
final rideRequestsForProvider = FutureProvider.autoDispose.family<List<RideJoinRequest>, String>((ref, slug) {
  return ref.watch(tripRepositoryProvider).getPendingRequestsFor(slug);
});

/// Aggregated "Requests" inbox — every pending request across all rides the
/// caller organizes.
final allPendingRequestsProvider = FutureProvider.autoDispose<List<RideJoinRequest>>((ref) {
  return ref.watch(tripRepositoryProvider).getAllPendingRequests();
});

/// The caller's own join-request status for a ride (null if never requested).
final myRequestStatusProvider = FutureProvider.autoDispose.family<MyRideRequestStatus?, String>((ref, slug) {
  return ref.watch(tripRepositoryProvider).getMyRequestStatus(slug);
});

/// The ride's group-chat conversation id, or null if no one's been approved yet.
final rideGroupConversationProvider = FutureProvider.autoDispose.family<String?, String>((ref, slug) {
  return ref.watch(tripRepositoryProvider).getGroupConversationId(slug);
});
