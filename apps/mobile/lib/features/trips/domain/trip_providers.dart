import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/trip_models.dart';
import '../data/trip_repository.dart';

const tripTabs = ['upcoming', 'weekend', 'adventure', 'road-trip', 'international', 'guided-tour', 'completed'];

final tripTabProvider = StateProvider.autoDispose<String>((ref) => 'upcoming');

final tripsProvider = FutureProvider.autoDispose<List<TripSummary>>((ref) {
  final tab = ref.watch(tripTabProvider);
  return ref.watch(tripRepositoryProvider).getAll(tab: tab);
});

final tripDetailProvider = FutureProvider.autoDispose.family<TripDetail, String>((ref, slug) {
  return ref.watch(tripRepositoryProvider).getBySlug(slug);
});
